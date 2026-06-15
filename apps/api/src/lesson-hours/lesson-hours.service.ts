import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import { BaseMasterDataService } from "../master-data/base-master-data.service";
import { createLessonHourSchema, updateLessonHourSchema } from "./lesson-hours.dto";

@Injectable()
export class LessonHoursService extends BaseMasterDataService<typeof createLessonHourSchema, typeof updateLessonHourSchema> {
  constructor(@Inject(PrismaService) prisma: PrismaService, @Inject(AuditService) auditService: AuditService) {
    super(prisma, auditService, {
      auditEntity: "lesson_hour",
      createSchema: createLessonHourSchema,
      defaultOrderBy: { order: "asc" },
      modelName: "lessonHour",
      searchableFields: ["name", "startTime", "endTime"],
      updateSchema: updateLessonHourSchema,
    });
  }
}
