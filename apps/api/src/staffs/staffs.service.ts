import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BasePeopleService } from "../people/base-people.service";
import { createStaffSchema, updateStaffSchema } from "./staffs.dto";

@Injectable()
export class StaffsService extends BasePeopleService<typeof createStaffSchema, typeof updateStaffSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "staff",
      createSchema: createStaffSchema,
      defaultOrderBy: { name: "asc" },
      modelName: "staff",
      searchableFields: ["nip", "name", "email", "phone", "position", "department"],
      updateSchema: updateStaffSchema,
      useSoftDelete: true,
    });
  }

  async findUniqueStaff(conditions: Array<Record<string, unknown>>) {
    return this.prisma.staff.findFirst({
      where: { OR: conditions, deletedAt: null },
    });
  }

  async createRaw(data: Record<string, unknown>) {
    return this.prisma.staff.create({ data: data as never });
  }

  async exportAll(): Promise<Record<string, unknown>[]> {
    return this.prisma.staff.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }) as unknown as Promise<Record<string, unknown>[]>;
  }
}
