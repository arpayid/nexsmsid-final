import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createSubjectSchema, updateSubjectSchema } from "./subjects.dto";

@Injectable()
export class SubjectsService extends BaseMasterDataService<typeof createSubjectSchema, typeof updateSubjectSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "subject",
      createSchema: createSubjectSchema,
      modelName: "subject",
      searchableFields: ["code", "name", "group"],
      updateSchema: updateSubjectSchema,
    });
  }

  async findUniqueSubject(code: string) {
    return this.prisma.subject.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
    });
  }

  async createRaw(data: Record<string, unknown>) {
    return this.prisma.subject.create({ data: data as never });
  }

  async exportAll(): Promise<Record<string, unknown>[]> {
    return this.prisma.subject.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
    }) as unknown as Promise<Record<string, unknown>[]>;
  }
}
