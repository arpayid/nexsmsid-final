import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createClassroomSchema, updateClassroomSchema } from "./classrooms.dto";

@Injectable()
export class ClassroomsService extends BaseMasterDataService<typeof createClassroomSchema, typeof updateClassroomSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "classroom",
      createSchema: createClassroomSchema,
      include: { competency: true },
      modelName: "classroom",
      searchableFields: ["code", "name"],
      updateSchema: updateClassroomSchema,
    });
  }

  async findUniqueClassroom(code: string) {
    return this.prisma.classroom.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
    });
  }

  async findCompetencyIdByCode(code: string) {
    const competency = await this.prisma.competency.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
      select: { id: true },
    });
    return competency?.id ?? null;
  }

  async createRaw(data: Record<string, unknown>) {
    return this.prisma.classroom.create({
      data: data as never,
      include: { competency: true },
    });
  }

  async exportAll(): Promise<Record<string, unknown>[]> {
    const items = await this.prisma.classroom.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      include: { competency: true },
    });

    return items.map((item) => {
      const record: Record<string, unknown> = { ...item };
      const competency = (item as { competency?: { code?: string } | null }).competency;
      record.competencyCode = competency?.code ?? "";
      delete record.competency;
      return record;
    });
  }
}
