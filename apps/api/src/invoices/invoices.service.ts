import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { InvoiceOverdueService } from "./invoice-overdue.service";
import { listQuerySchema } from "../master-data/base-master-data.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import { createInvoiceSchema, updateInvoiceSchema } from "./invoices.dto";

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
    @Inject(InvoiceOverdueService) private readonly invoiceOverdueService: InvoiceOverdueService,
  ) {}

  async list(query: unknown) {
    await this.invoiceOverdueService.syncOverdueInvoices();
    const params = parseWithSchema(listQuerySchema, query);
    const where: Record<string, unknown> = { deletedAt: null };
    const skip = (params.page - 1) * params.limit;

    if (params.search) {
      where.OR = [
        { invoiceNumber: { contains: params.search, mode: "insensitive" } },
        { student: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { student: true, academicYear: true, semester: true, items: true, payments: { where: { status: "VERIFIED" } } },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        student: true,
        academicYear: true,
        semester: true,
        items: true,
        payments: { orderBy: { createdAt: "desc" }, include: { verifiedBy: true } },
      },
    });
    if (!item) throw new NotFoundException("Invoice not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createInvoiceSchema, input);
    const items = data.items;
    delete (data as Record<string, unknown>).items;

    const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    const total = subtotal - data.discount + data.penalty;

    const now = new Date();
    const invoice = await this.createWithUniqueNumber(data, items, subtotal, total, now);

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "invoice.create",
      entity: "invoice",
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber, total },
    });
    return invoice;
  }

  /** invoiceNumber is @unique; concurrent creates may collide on count()+1, so retry with a fresh count. */
  private async createWithUniqueNumber(
    data: Omit<ReturnType<typeof createInvoiceSchema.parse>, "items">,
    items: ReturnType<typeof createInvoiceSchema.parse>["items"],
    subtotal: number,
    total: number,
    now: Date,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const count = await this.prisma.invoice.count();
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(count + 1 + attempt).padStart(5, "0")}`;

      try {
        return await this.prisma.invoice.create({
          data: {
            invoiceNumber,
            studentId: data.studentId,
            academicYearId: data.academicYearId || null,
            semesterId: data.semesterId || null,
            issueDate: now,
            dueDate: data.dueDate || null,
            subtotal,
            discount: data.discount,
            penalty: data.penalty,
            total,
            paidAmount: 0,
            status: "DRAFT",
            note: data.note || null,
            items: {
              create: items.map((item) => ({
                paymentCategoryId: item.paymentCategoryId || null,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: Number(item.unitPrice) * item.quantity,
              })),
            },
          },
          include: { student: true, items: true },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
        throw error;
      }
    }

    throw new ConflictException("Failed to allocate a unique invoice number, please retry");
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT invoices can be updated");

    const data = parseWithSchema(updateInvoiceSchema, input);
    const updateData: Record<string, unknown> = {};
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.penalty !== undefined) updateData.penalty = data.penalty;
    if (data.note !== undefined) updateData.note = data.note;

    if (data.discount !== undefined || data.penalty !== undefined) {
      const discount = data.discount ?? Number(existing.discount);
      const penalty = data.penalty ?? Number(existing.penalty);
      updateData.total = Number(existing.subtotal) - discount + penalty;
    }

    const invoice = await this.prisma.invoice.update({ where: { id }, data: updateData, include: { student: true, items: true } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "invoice.update",
      entity: "invoice",
      entityId: id,
      metadata: { discount: data.discount, penalty: data.penalty, dueDate: data.dueDate?.toISOString() },
    });
    return invoice;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT invoices can be deleted");

    await this.prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.record({ ...meta, actorId: actor.id, action: "invoice.delete", entity: "invoice", entityId: id, metadata: {} });
    return { deleted: true, id };
  }

  async issue(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT invoices can be issued");

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: "ISSUED" },
      include: { student: true, items: true },
    });
    await this.auditService.record({ ...meta, actorId: actor.id, action: "invoice.issue", entity: "invoice", entityId: id, metadata: {} });
    await this.notificationEvents.invoiceIssued(invoice, actor, meta);
    return invoice;
  }

  async cancel(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status === "PAID" || existing.status === "CANCELLED")
      throw new BadRequestException("Cannot cancel PAID or CANCELLED invoice");

    // Funds already collected must be reversed before the invoice can be voided,
    // otherwise verified payments would be stranded on a cancelled invoice.
    const verifiedPayments = await this.prisma.payment.count({ where: { invoiceId: id, status: "VERIFIED" } });
    if (verifiedPayments > 0) {
      throw new BadRequestException("Cannot cancel an invoice with verified payments; cancel the payments first");
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { student: true, items: true },
    });
    await this.auditService.record({ ...meta, actorId: actor.id, action: "invoice.cancel", entity: "invoice", entityId: id, metadata: {} });
    return invoice;
  }
}
