import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { listQuerySchema } from "../master-data/base-master-data.service";
import { createPpdbPeriodSchema, updatePpdbPeriodSchema } from "./ppdb-periods.dto";

@Injectable()
export class PpdbPeriodsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(listQuerySchema, query);
    const where: Record<string, unknown> = {};
    const skip = (params.page - 1) * params.limit;

    if (params.search) {
      where.OR = [{ name: { contains: params.search, mode: "insensitive" } }];
    }

    const [items, total] = await Promise.all([
      this.prisma.ppdbPeriod.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { startDate: "desc" },
        include: { academicYear: true, _count: { select: { registrations: true } } },
      }),
      this.prisma.ppdbPeriod.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.ppdbPeriod.findFirst({
      where: { id },
      include: { academicYear: true, _count: { select: { registrations: true } } },
    });
    if (!item) throw new NotFoundException("PPDB period not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createPpdbPeriodSchema, input);
    const period = await this.prisma.ppdbPeriod.create({
      data: {
        name: data.name,
        academicYearId: data.academicYearId || null,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        quota: data.quota || null,
      },
      include: { academicYear: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.period.create",
      entity: "ppdb_period",
      entityId: period.id,
      metadata: { name: data.name },
    });
    return period;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updatePpdbPeriodSchema, input);
    const period = await this.prisma.ppdbPeriod.update({ where: { id }, data, include: { academicYear: true } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.period.update",
      entity: "ppdb_period",
      entityId: id,
      metadata: data,
    });
    return period;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    await this.prisma.ppdbPeriod.delete({ where: { id } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.period.delete",
      entity: "ppdb_period",
      entityId: id,
      metadata: {},
    });
    return { deleted: true, id };
  }
}
