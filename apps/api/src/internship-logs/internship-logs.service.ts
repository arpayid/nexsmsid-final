import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import {
  createInternshipLogSchema,
  internshipLogListQuerySchema,
  rejectInternshipLogSchema,
  updateInternshipLogSchema,
} from "./internship-logs.dto";

@Injectable()
export class InternshipLogsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
  ) {}

  async list(internshipId: string, query: unknown) {
    await this.getInternship(internshipId);
    const params = parseWithSchema(internshipLogListQuerySchema, query);
    const where: Record<string, unknown> = { internshipId };
    if (params.status) where.status = params.status;
    if (params.search) where.activity = { contains: params.search, mode: "insensitive" };
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.internshipLog.findMany({ where, skip, take: params.limit, orderBy: { date: "desc" }, include: { reviewedBy: true } }),
      this.prisma.internshipLog.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.internshipLog.findFirst({
      where: { id },
      include: { internship: { include: { student: true, industryPartner: true } }, reviewedBy: true },
    });
    if (!item) throw new NotFoundException("Internship log not found");
    return item;
  }

  async create(internshipId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const internship = await this.getInternship(internshipId);
    if (internship.status === "CANCELLED") throw new BadRequestException("Cannot create log for CANCELLED internship");
    const data = parseWithSchema(createInternshipLogSchema, input);
    const item = await this.prisma.internshipLog.create({ data: { internshipId, ...this.cleanOptional(data) } as never });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship-log.create",
      entity: "internship_log",
      entityId: item.id,
      metadata: { internshipId },
    });
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (!["DRAFT", "SUBMITTED"].includes(existing.status)) throw new BadRequestException("Only DRAFT or SUBMITTED logs can be updated");
    const data = parseWithSchema(updateInternshipLogSchema, input);
    const item = await this.prisma.internshipLog.update({ where: { id }, data: this.cleanOptional(data) });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship-log.update",
      entity: "internship_log",
      entityId: id,
      metadata: data,
    });
    return item;
  }

  async approve(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "SUBMITTED") throw new BadRequestException("Only SUBMITTED logs can be approved");
    const item = await this.prisma.internshipLog.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: actor.id, reviewedAt: new Date() },
      include: { internship: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship-log.approve",
      entity: "internship_log",
      entityId: id,
      metadata: {},
    });
    await this.notificationEvents.internshipLogReviewed(item, actor, meta);
    return item;
  }

  async reject(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "SUBMITTED") throw new BadRequestException("Only SUBMITTED logs can be rejected");
    const data = parseWithSchema(rejectInternshipLogSchema, input);
    const item = await this.prisma.internshipLog.update({
      where: { id },
      data: { status: "REJECTED", note: data.note, reviewedById: actor.id, reviewedAt: new Date() },
      include: { internship: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship-log.reject",
      entity: "internship_log",
      entityId: id,
      metadata: { note: data.note },
    });
    await this.notificationEvents.internshipLogReviewed(item, actor, meta);
    return item;
  }

  private async getInternship(id: string) {
    const internship = await this.prisma.internship.findFirst({ where: { id, deletedAt: null } });
    if (!internship) throw new NotFoundException("Internship not found");
    return internship;
  }

  private cleanOptional(data: Record<string, unknown>) {
    const cleaned = { ...data };
    for (const key of ["obstacle", "solution", "note"]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    return cleaned;
  }
}
