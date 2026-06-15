import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BasePeopleService } from "../people/base-people.service";
import { createGuardianSchema, updateGuardianSchema } from "./guardians.dto";

@Injectable()
export class GuardiansService extends BasePeopleService<typeof createGuardianSchema, typeof updateGuardianSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "guardian",
      createSchema: createGuardianSchema,
      defaultOrderBy: { name: "asc" },
      modelName: "guardian",
      searchableFields: ["name", "phone", "email", "occupation"],
      updateSchema: updateGuardianSchema,
      useSoftDelete: false,
    });
  }

  async findUniqueGuardian(conditions: Array<Record<string, unknown>>) {
    return this.prisma.guardian.findFirst({ where: { OR: conditions } });
  }

  async createRaw(data: Record<string, unknown>) {
    return this.prisma.guardian.create({ data: data as never });
  }

  async exportAll(): Promise<Record<string, unknown>[]> {
    return this.prisma.guardian.findMany({
      orderBy: { name: "asc" },
    }) as unknown as Promise<Record<string, unknown>[]>;
  }
}
