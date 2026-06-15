import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { createTracerStudySchema, tracerStudyListQuerySchema, updateTracerStudySchema } from "./tracer-studies.dto";

@Injectable()
export class TracerStudiesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(tracerStudyListQuerySchema, query);
    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.year) where.year = params.year;
    if (params.search) {
      where.OR = [
        { companyName: { contains: params.search, mode: "insensitive" } },
        { university: { contains: params.search, mode: "insensitive" } },
        { alumni: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.tracerStudy.findMany({ where, skip, take: params.limit, orderBy: { createdAt: "desc" }, include: { alumni: true } }),
      this.prisma.tracerStudy.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.tracerStudy.findFirst({ where: { id }, include: { alumni: true } });
    if (!item) throw new NotFoundException("Tracer study not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createTracerStudySchema, input);
    const item = await this.prisma.tracerStudy.create({ data: this.cleanOptional(data) as never, include: { alumni: true } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "tracer-study.create",
      entity: "tracer_study",
      entityId: item.id,
      metadata: { alumniId: item.alumniId, year: item.year },
    });
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updateTracerStudySchema, input);
    const item = await this.prisma.tracerStudy.update({ where: { id }, data: this.cleanOptional(data), include: { alumni: true } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "tracer-study.update",
      entity: "tracer_study",
      entityId: id,
      metadata: data,
    });
    return item;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    await this.prisma.tracerStudy.delete({ where: { id } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "tracer-study.delete",
      entity: "tracer_study",
      entityId: id,
      metadata: {},
    });
    return { deleted: true, id };
  }

  private cleanOptional(data: Record<string, unknown>) {
    const cleaned = { ...data };
    for (const key of ["companyName", "position", "university", "major", "businessName", "incomeRange", "feedback"]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    return cleaned;
  }
}
