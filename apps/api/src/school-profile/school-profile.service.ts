import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { updateSchoolProfileSchema } from "./school-profile.dto";

@Injectable()
export class SchoolProfileService {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async get() {
    const existing = await this.prisma.schoolProfile.findFirst({ orderBy: { createdAt: "asc" } });

    if (existing) {
      return existing;
    }

    return this.prisma.schoolProfile.create({
      data: {
        name: "NexSMSID School",
      },
    });
  }

  async update(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(updateSchoolProfileSchema, input);
    const existing = await this.get();
    const profile = await this.prisma.schoolProfile.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "school_profile.update",
      entity: "school_profile",
      entityId: profile.id,
      metadata: {
        name: profile.name,
        npsn: profile.npsn,
      },
    });

    return profile;
  }
}
