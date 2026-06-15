import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { createIndustryPartnerSchema, industryPartnerListQuerySchema, updateIndustryPartnerSchema } from "./industry-partners.dto";

@Injectable()
export class IndustryPartnersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(industryPartnerListQuerySchema, query);
    const where: Record<string, unknown> = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { contactPerson: { contains: params.search, mode: "insensitive" } },
        { type: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.industryPartner.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { internships: true, jobVacancies: true } } },
      }),
      this.prisma.industryPartner.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.industryPartner.findFirst({
      where: { id, deletedAt: null },
      include: { internships: true, jobVacancies: true },
    });
    if (!item) throw new NotFoundException("Industry partner not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createIndustryPartnerSchema, input);
    const item = await this.prisma.industryPartner.create({
      data: {
        ...data,
        type: data.type || null,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        website: data.website || null,
        note: data.note || null,
      },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "industry-partner.create",
      entity: "industry_partner",
      entityId: item.id,
      metadata: { name: item.name },
    });
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updateIndustryPartnerSchema, input);
    const item = await this.prisma.industryPartner.update({ where: { id }, data: this.cleanOptional(data) });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "industry-partner.update",
      entity: "industry_partner",
      entityId: id,
      metadata: data,
    });
    return item;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    await this.prisma.industryPartner.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "industry-partner.delete",
      entity: "industry_partner",
      entityId: id,
      metadata: {},
    });
    return { deleted: true, id };
  }

  private cleanOptional(data: Record<string, unknown>) {
    const cleaned = { ...data };
    for (const key of ["type", "contactPerson", "phone", "email", "address", "website", "note"]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    return cleaned;
  }
}
