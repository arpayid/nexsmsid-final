import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { InventoryItemsService } from "./inventory-items.service";
import { CreateInventoryLoanDto, UpdateInventoryLoanDto, InventoryQueryDto } from "./inventory.dto";

@Injectable()
export class InventoryLoansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private itemsService: InventoryItemsService,
  ) {}

  private async createMovementFromLoan(loan: { itemId: string; quantity: number }, type: "BORROW" | "RETURN", actorId: string) {
    await this.itemsService.createMovement(
      {
        itemId: loan.itemId,
        type,
        quantity: loan.quantity,
        referenceType: "LOAN",
        referenceId: "",
        note: `${type === "BORROW" ? "Loan" : "Return"} ${loan.itemId}`,
      },
      actorId,
    );
  }

  async getLoans(query: InventoryQueryDto) {
    const where = { deletedAt: null } as const;
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.inventoryLoan.count({ where }),
      this.prisma.inventoryLoan.findMany({
        where: { ...where },
        include: { item: true, borrowerUser: true },
        skip,
        take: limit,
        orderBy: { requestedAt: "desc" },
      }),
    ]);
    return { total, page, limit, data };
  }

  async getLoan(id: string) {
    const loan = await this.prisma.inventoryLoan.findUnique({
      where: { id, deletedAt: null },
      include: { item: true, borrowerUser: true, approvedBy: true },
    });
    if (!loan) throw new NotFoundException("Loan not found");
    return loan;
  }

  async createLoan(dto: CreateInventoryLoanDto, actorId: string) {
    const { dueAt, ...rest } = dto;
    const loan = await this.prisma.inventoryLoan.create({
      data: { ...rest, dueAt: dueAt ? new Date(dueAt) : undefined, createdById: actorId },
    });
    await this.audit.record({
      actorId,
      action: "inventory.loan.create",
      entity: "InventoryLoan",
      entityId: loan.id,
      metadata: { itemId: loan.itemId },
    });
    return loan;
  }

  async updateLoan(id: string, dto: UpdateInventoryLoanDto, actorId: string) {
    const { dueAt, ...rest } = dto;
    return this.prisma.inventoryLoan.update({ where: { id }, data: { ...rest, dueAt: dueAt ? new Date(dueAt) : undefined } });
  }

  async approveLoan(id: string, actorId: string) {
    const loan = await this.getLoan(id);
    if (loan.status !== "REQUESTED") throw new BadRequestException("Loan must be REQUESTED to approve");
    const updated = await this.prisma.inventoryLoan.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date(), approvedById: actorId },
    });
    await this.audit.record({ actorId, action: "inventory.loan.approve", entity: "InventoryLoan", entityId: id, metadata: {} });
    return updated;
  }

  async rejectLoan(id: string, actorId: string) {
    const loan = await this.getLoan(id);
    if (loan.status !== "REQUESTED") throw new BadRequestException("Loan must be REQUESTED to reject");
    const updated = await this.prisma.inventoryLoan.update({
      where: { id },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectedById: actorId },
    });
    await this.audit.record({ actorId, action: "inventory.loan.reject", entity: "InventoryLoan", entityId: id, metadata: {} });
    return updated;
  }

  async markLoanBorrowed(id: string, actorId: string) {
    const loan = await this.getLoan(id);
    if (loan.status !== "APPROVED") throw new BadRequestException("Loan must be APPROVED to mark as borrowed");
    await this.createMovementFromLoan(loan, "BORROW", actorId);
    const updated = await this.prisma.inventoryLoan.update({ where: { id }, data: { status: "BORROWED", borrowedAt: new Date() } });
    await this.prisma.inventoryItem.update({ where: { id: loan.itemId }, data: { status: "BORROWED" } });
    await this.audit.record({ actorId, action: "inventory.loan.borrowed", entity: "InventoryLoan", entityId: id, metadata: {} });
    return updated;
  }

  async returnLoan(id: string, actorId: string) {
    const loan = await this.getLoan(id);
    if (loan.status !== "BORROWED" && loan.status !== "OVERDUE")
      throw new BadRequestException("Loan must be BORROWED or OVERDUE to return");
    await this.createMovementFromLoan(loan, "RETURN", actorId);
    const updated = await this.prisma.inventoryLoan.update({ where: { id }, data: { status: "RETURNED", returnedAt: new Date() } });
    await this.prisma.inventoryItem.update({ where: { id: loan.itemId }, data: { status: "ACTIVE" } });
    await this.audit.record({ actorId, action: "inventory.loan.return", entity: "InventoryLoan", entityId: id, metadata: {} });
    return updated;
  }

  async cancelLoan(id: string, actorId: string) {
    const loan = await this.getLoan(id);
    if (loan.status === "BORROWED" || loan.status === "RETURNED") throw new BadRequestException("Cannot cancel BORROWED or RETURNED loan");
    const updated = await this.prisma.inventoryLoan.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    await this.audit.record({ actorId, action: "inventory.loan.cancel", entity: "InventoryLoan", entityId: id, metadata: {} });
    return updated;
  }

  async deleteLoan(id: string, _actorId?: string) {
    await this.prisma.inventoryLoan.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
