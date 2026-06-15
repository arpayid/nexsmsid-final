import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createCompetencySchema, updateCompetencySchema } from "./competencies.dto";

@Injectable()
export class CompetenciesService extends BaseMasterDataService<typeof createCompetencySchema, typeof updateCompetencySchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "competency",
      createSchema: createCompetencySchema,
      include: { department: true },
      modelName: "competency",
      searchableFields: ["code", "name"],
      updateSchema: updateCompetencySchema,
    });
  }
}
