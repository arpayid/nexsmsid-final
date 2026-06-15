import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { listQuerySchema } from "../master-data/base-master-data.service";
import { createExpenseSchema, updateExpenseSchema } from "./expenses.dto";

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(listQuerySchema, query);
    const where: Record<string, unknown> = { deletedAt: null };
    const skip = (params.page - 1) * params.limit;

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { expenseNumber: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { date: "desc" },
        include: { approvedBy: true },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: { approvedBy: true },
    });
    if (!item) throw new NotFoundException("Expense not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createExpenseSchema, input);

    const count = await this.prisma.expense.count();
    const now = new Date();
    const expenseNumber = `EXP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(5, "0")}`;

    const expense = await this.prisma.expense.create({
      data: {
        expenseNumber,
        title: data.title,
        category: data.category,
        amount: data.amount,
        date: data.date || now,
        note: data.note || null,
        status: "DRAFT",
      },
      include: { approvedBy: true },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "expense.create",
      entity: "expense",
      entityId: expense.id,
      metadata: { expenseNumber, amount: data.amount },
    });
    return expense;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT expenses can be updated");

    const data = parseWithSchema(updateExpenseSchema, input);
    const expense = await this.prisma.expense.update({ where: { id }, data, include: { approvedBy: true } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "expense.update",
      entity: "expense",
      entityId: id,
      metadata: data,
    });
    return expense;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT expenses can be deleted");

    await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.record({ ...meta, actorId: actor.id, action: "expense.delete", entity: "expense", entityId: id, metadata: {} });
    return { deleted: true, id };
  }

  async approve(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT expenses can be approved");

    const expense = await this.prisma.expense.update({
      where: { id },
      data: { status: "APPROVED", approvedById: actor.id },
      include: { approvedBy: true },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "expense.approve",
      entity: "expense",
      entityId: id,
      metadata: {},
    });
    return expense;
  }

  async markPaid(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "APPROVED") throw new BadRequestException("Only APPROVED expenses can be marked paid");

    const expense = await this.prisma.expense.update({
      where: { id },
      data: { status: "PAID" },
      include: { approvedBy: true },
    });

    await this.auditService.record({ ...meta, actorId: actor.id, action: "expense.paid", entity: "expense", entityId: id, metadata: {} });
    return expense;
  }
}
