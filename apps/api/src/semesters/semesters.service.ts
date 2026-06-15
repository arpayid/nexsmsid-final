import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createSemesterSchema, updateSemesterSchema } from "./semesters.dto";

@Injectable()
export class SemestersService extends BaseMasterDataService<typeof createSemesterSchema, typeof updateSemesterSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "semester",
      createSchema: createSemesterSchema,
      defaultOrderBy: { order: "asc" },
      include: { academicYear: true },
      modelName: "semester",
      searchableFields: ["name"],
      updateSchema: updateSemesterSchema,
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

  /** Guarantees at most one active semester by deactivating all others. */
  private async enforceSingleActive(item: Record<string, unknown>) {
    if (!item || item.isActive !== true || typeof item.id !== "string") {
      return;
    }
    await this.prisma.semester.updateMany({
      where: { id: { not: item.id }, isActive: true },
      data: { isActive: false },
    });
  }
}
