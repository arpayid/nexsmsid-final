import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createAcademicYearSchema, updateAcademicYearSchema } from "./academic-years.dto";

@Injectable()
export class AcademicYearsService extends BaseMasterDataService<typeof createAcademicYearSchema, typeof updateAcademicYearSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "academic_year",
      createSchema: createAcademicYearSchema,
      defaultOrderBy: { startDate: "desc" },
      modelName: "academicYear",
      searchableFields: ["name"],
      updateSchema: updateAcademicYearSchema,
    });
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const item = await super.create(input, actor, meta);
    await this.enforceSingleActive(item);
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const item = await super.update(id, input, actor, meta);
    await this.enforceSingleActive(item);
    return item;
  }

  /** Guarantees at most one active academic year by deactivating all others. */
  private async enforceSingleActive(item: Record<string, unknown>) {
    if (!item || item.isActive !== true || typeof item.id !== "string") {
      return;
    }
    await this.prisma.academicYear.updateMany({
      where: { id: { not: item.id }, isActive: true },
      data: { isActive: false },
    });
  }
}
