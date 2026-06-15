import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createDepartmentSchema, updateDepartmentSchema } from "./departments.dto";

@Injectable()
export class DepartmentsService extends BaseMasterDataService<typeof createDepartmentSchema, typeof updateDepartmentSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "department",
      createSchema: createDepartmentSchema,
      modelName: "department",
      searchableFields: ["code", "name"],
      updateSchema: updateDepartmentSchema,
    });
  }
}
