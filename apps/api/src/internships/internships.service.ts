import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { createInternshipSchema, internshipScoreSchema, internshipsListQuerySchema, updateInternshipSchema } from "./internships.dto";

@Injectable()
export class InternshipsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(internshipsListQuerySchema, query);
    const where: Record<string, unknown> = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.studentId) where.studentId = params.studentId;
    if (params.industryPartnerId) where.industryPartnerId = params.industryPartnerId;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { student: { name: { contains: params.search, mode: "insensitive" } } },
        { industryPartner: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    const skip = (params.page - 1) * params.limit;
    const include = { student: true, industryPartner: true, supervisor: true, score: true, _count: { select: { logs: true } } };
    const [items, total] = await Promise.all([
      this.prisma.internship.findMany({ where, skip, take: params.limit, orderBy: { createdAt: "desc" }, include }),
      this.prisma.internship.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.internship.findFirst({
      where: { id, deletedAt: null },
      include: { student: true, industryPartner: true, supervisor: true, logs: { orderBy: { date: "desc" } }, score: true },
    });
    if (!item) throw new NotFoundException("Internship not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createInternshipSchema, input);
    if (data.endDate < data.startDate) throw new BadRequestException("End date must be after start date");
    const item = await this.prisma.internship.create({
      data: { ...data, supervisorTeacherId: data.supervisorTeacherId || null, note: data.note || null },
      include: { student: true, industryPartner: true, supervisor: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship.create",
      entity: "internship",
      entityId: item.id,
      metadata: { title: item.title },
    });
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updateInternshipSchema, input);
    if (data.startDate && data.endDate && data.endDate < data.startDate) throw new BadRequestException("End date must be after start date");
    const item = await this.prisma.internship.update({
      where: { id },
      data: this.cleanOptional(data),
      include: { student: true, industryPartner: true, supervisor: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship.update",
      entity: "internship",
      entityId: id,
      metadata: data,
    });
    return item;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    await this.prisma.internship.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship.delete",
      entity: "internship",
      entityId: id,
      metadata: {},
    });
    return { deleted: true, id };
  }

  async start(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "PLANNED") throw new BadRequestException("Only PLANNED internships can be started");
    const item = await this.prisma.internship.update({
      where: { id },
      data: { status: "ONGOING" },
      include: { student: true, industryPartner: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship.start",
      entity: "internship",
      entityId: id,
      metadata: {},
    });
    return item;
  }

  async complete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "ONGOING") throw new BadRequestException("Only ONGOING internships can be completed");
    const finalScore = existing.score ? Number(existing.score.finalScore) : existing.finalScore ? Number(existing.finalScore) : null;
    const item = await this.prisma.internship.update({
      where: { id },
      data: { status: "COMPLETED", finalScore },
      include: { student: true, industryPartner: true, score: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship.complete",
      entity: "internship",
      entityId: id,
      metadata: { finalScore },
    });
    return item;
  }

  async cancel(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status === "COMPLETED") throw new BadRequestException("Completed internships cannot be cancelled");
    const item = await this.prisma.internship.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { student: true, industryPartner: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship.cancel",
      entity: "internship",
      entityId: id,
      metadata: {},
    });
    return item;
  }

  async score(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(internshipScoreSchema, input);
    const finalScore = (data.disciplineScore + data.skillScore + data.attitudeScore + data.reportScore) / 4;
    const [score] = await this.prisma.$transaction([
      this.prisma.internshipScore.upsert({
        where: { internshipId: id },
        update: { ...data, finalScore, assessedById: actor.id, note: data.note || null },
        create: { internshipId: id, ...data, finalScore, assessedById: actor.id, note: data.note || null },
      }),
      this.prisma.internship.update({ where: { id }, data: { finalScore } }),
    ]);
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "internship.score",
      entity: "internship",
      entityId: id,
      metadata: { finalScore },
    });
    return score;
  }

  private cleanOptional(data: Record<string, unknown>) {
    const cleaned = { ...data };
    if (cleaned.supervisorTeacherId === "") cleaned.supervisorTeacherId = null;
    if (cleaned.note === "") cleaned.note = null;
    return cleaned;
  }
}
