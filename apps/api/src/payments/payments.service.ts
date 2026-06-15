import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { InvoiceStatus } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { listQuerySchema } from "../master-data/base-master-data.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import { createPaymentSchema, rejectPaymentSchema, updatePaymentSchema, verifyPaymentSchema } from "./payments.dto";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(listQuerySchema, query);
    const where: Record<string, unknown> = {};
    const skip = (params.page - 1) * params.limit;

    if (params.search) {
      where.OR = [
        { paymentNumber: { contains: params.search, mode: "insensitive" } },
        { invoice: { student: { name: { contains: params.search, mode: "insensitive" } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { invoice: { include: { student: true } }, verifiedBy: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.payment.findFirst({
      where: { id },
      include: { invoice: { include: { student: true } }, verifiedBy: true },
    });
    if (!item) throw new NotFoundException("Payment not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createPaymentSchema, input);

    const invoice = await this.prisma.invoice.findFirst({ where: { id: data.invoiceId, deletedAt: null } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "CANCELLED") throw new BadRequestException("Cannot add payment to CANCELLED invoice");
    if (invoice.status === "PAID") throw new BadRequestException("Invoice is already PAID");

    const now = new Date();
    const payment = await this.createWithUniqueNumber(data, now);

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "payment.create",
      entity: "payment",
      entityId: payment.id,
      metadata: { paymentNumber: payment.paymentNumber, amount: data.amount },
    });
    return payment;
  }

  /** paymentNumber is @unique; concurrent creates may collide on count()+1, so retry with a fresh count. */
  private async createWithUniqueNumber(data: ReturnType<typeof createPaymentSchema.parse>, now: Date) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const count = await this.prisma.payment.count();
      const paymentNumber = `PAY-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(count + 1 + attempt).padStart(5, "0")}`;

      try {
        return await this.prisma.payment.create({
          data: {
            paymentNumber,
            invoiceId: data.invoiceId,
            amount: data.amount,
            method: data.method,
            paidAt: data.paidAt || now,
            proofUrl: data.proofUrl || null,
            note: data.note || null,
            status: "PENDING",
          },
          include: { invoice: { include: { student: true } } },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
        throw error;
      }
    }

    throw new ConflictException("Failed to allocate a unique payment number, please retry");
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "PENDING") throw new BadRequestException("Only PENDING payments can be updated");

    const data = parseWithSchema(updatePaymentSchema, input);
    const payment = await this.prisma.payment.update({ where: { id }, data, include: { invoice: { include: { student: true } } } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "payment.update",
      entity: "payment",
      entityId: id,
      metadata: data,
    });
    return payment;
  }

  async verify(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(verifyPaymentSchema, input);

    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({ where: { id } });
      if (!payment) throw new NotFoundException("Payment not found");

      // Lock the invoice row so concurrent verifications/cancellations serialize
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM invoices WHERE id = ${payment.invoiceId} FOR UPDATE`;
      if (locked.length === 0) throw new NotFoundException("Invoice not found");

      // Conditional update: only one concurrent verify of this payment can win
      const claimed = await tx.payment.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "VERIFIED", verifiedAt: new Date(), verifiedById: actor.id, note: data.note || payment.note },
      });
      if (claimed.count === 0) throw new BadRequestException("Only PENDING payments can be verified");

      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: payment.invoiceId } });

      // A payment must never resurrect or mutate an invoice that is no longer collectable.
      if (invoice.deletedAt) throw new BadRequestException("Cannot verify a payment for a deleted invoice");
      if (invoice.status === "CANCELLED") throw new BadRequestException("Cannot verify a payment for a cancelled invoice");

      // Recompute from the authoritative sum of verified payments (no read-modify-write)
      const verifiedSum = await tx.payment.aggregate({
        where: { invoiceId: payment.invoiceId, status: "VERIFIED" },
        _sum: { amount: true },
      });
      const newPaid = verifiedSum._sum.amount ?? new Prisma.Decimal(0);

      if (newPaid.greaterThan(invoice.total)) throw new BadRequestException("Payment would exceed invoice total");

      let invoiceStatus = invoice.status;
      if (newPaid.greaterThanOrEqualTo(invoice.total)) invoiceStatus = "PAID";
      else if (newPaid.greaterThan(0)) invoiceStatus = "PARTIAL";

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { paidAmount: newPaid, status: invoiceStatus },
      });

      return tx.payment.findUniqueOrThrow({
        where: { id },
        include: { invoice: { include: { student: true } }, verifiedBy: true },
      });
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "payment.verify",
      entity: "payment",
      entityId: id,
      metadata: { invoiceStatus: updatedPayment.invoice.status },
    });
    await this.notificationEvents.paymentStatusChanged(updatedPayment, actor, meta);
    return updatedPayment;
  }

  async reject(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const payment = await this.findById(id);
    if (payment.status !== "PENDING") throw new BadRequestException("Only PENDING payments can be rejected");

    const data = parseWithSchema(rejectPaymentSchema, input);
    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: "REJECTED", note: data.note || payment.note },
      include: { invoice: { include: { student: true } } },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "payment.reject",
      entity: "payment",
      entityId: id,
      metadata: { note: data.note },
    });
    await this.notificationEvents.paymentStatusChanged(updated, actor, meta);
    return updated;
  }

  async cancel(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({ where: { id } });
      if (!payment) throw new NotFoundException("Payment not found");
      if (payment.status === "CANCELLED") throw new BadRequestException("Payment is already cancelled");

      if (payment.status === "VERIFIED") {
        // Lock the invoice row so concurrent verifications/cancellations serialize
        const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM invoices WHERE id = ${payment.invoiceId} FOR UPDATE`;
        if (locked.length === 0) throw new NotFoundException("Invoice not found");

        const claimed = await tx.payment.updateMany({
          where: { id, status: "VERIFIED" },
          data: { status: "CANCELLED" },
        });
        if (claimed.count === 0) throw new BadRequestException("Payment is already cancelled");

        const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: payment.invoiceId } });
        const verifiedSum = await tx.payment.aggregate({
          where: { invoiceId: payment.invoiceId, status: "VERIFIED" },
          _sum: { amount: true },
        });
        const newPaid = verifiedSum._sum.amount ?? new Prisma.Decimal(0);
        const invoiceStatus = resolveInvoiceStatusAfterCancellation(newPaid, invoice.total);

        await tx.invoice.update({ where: { id: payment.invoiceId }, data: { paidAmount: newPaid, status: invoiceStatus } });
      } else {
        const claimed = await tx.payment.updateMany({
          where: { id, status: payment.status },
          data: { status: "CANCELLED" },
        });
        if (claimed.count === 0) throw new BadRequestException("Payment status changed, please retry");
      }
    });

    const updated = await this.findById(id);
    await this.auditService.record({ ...meta, actorId: actor.id, action: "payment.cancel", entity: "payment", entityId: id, metadata: {} });
    return updated;
  }
}

function resolveInvoiceStatusAfterCancellation(paidAmount: Prisma.Decimal, totalAmount: Prisma.Decimal): InvoiceStatus {
  if (paidAmount.lessThanOrEqualTo(0)) return "ISSUED";
  if (paidAmount.lessThan(totalAmount)) return "PARTIAL";

  return "PAID";
}
