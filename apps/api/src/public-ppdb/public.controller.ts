import { Body, Controller, Get, Inject, Post, Req, UnauthorizedException } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { z } from "zod";

import { AuditService } from "../audit/audit.service";
import { Public } from "../auth/decorators/public.decorator";
import { getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CaptchaService } from "../common/captcha/captcha.service";
import { apiSuccess } from "../common/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { PrismaService } from "../database/prisma.service";
import { publicPpdbSetPinSchema } from "./public-ppdb.dto";
import { PublicSiteService } from "./public-site.service";

const checkStatusSchema = z.object({
  registrationNumber: z.string().min(3),
  phone: z.string().min(8),
  pin: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  captchaToken: z.string().trim().optional(),
});

@Controller("public")
@Public()
@ApiTags("Public")
export class PublicController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PublicSiteService) private readonly publicSite: PublicSiteService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(CaptchaService) private readonly captchaService: CaptchaService,
  ) {}

  @ApiOperation({ summary: "Get school stats for landing page" })
  @Get("school-stats")
  async getSchoolStats() {
    const [students, teachers, staffs, competencies, partners] = await Promise.all([
      this.prisma.student.count({ where: { status: "ACTIVE", deletedAt: null } }),
      this.prisma.teacher.count({ where: { status: "ACTIVE" } }),
      this.prisma.staff.count({ where: { status: "ACTIVE" } }),
      this.prisma.competency.count({ where: { isActive: true } }),
      this.prisma.industryPartner.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      success: true,
      data: {
        activeStudents: students,
        totalTeachers: teachers + staffs,
        totalPrograms: competencies,
        totalPartners: partners,
      },
    };
  }

  @ApiOperation({ summary: "Get public school profile" })
  @Get("school-profile")
  async getSchoolProfile() {
    return apiSuccess("School profile retrieved", await this.publicSite.getSchoolProfile());
  }

  @ApiOperation({ summary: "List active competencies for public site" })
  @Get("competencies")
  async getCompetencies() {
    return apiSuccess("Competencies retrieved", await this.publicSite.getCompetencies());
  }

  @ApiOperation({ summary: "List active industry partners" })
  @Get("partners")
  async getPartners() {
    return apiSuccess("Industry partners retrieved", await this.publicSite.getPartners());
  }

  @ApiOperation({ summary: "Get active PPDB period overview" })
  @Get("ppdb/overview")
  async getPpdbOverview() {
    return apiSuccess("PPDB overview retrieved", await this.publicSite.getPpdbOverview());
  }

  @ApiOperation({ summary: "Check PPDB registration status" })
  @Post("ppdb/check-status")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async checkPpdbStatus(
    @Body(new ZodValidationPipe(checkStatusSchema)) body: z.infer<typeof checkStatusSchema>,
    @Req() request: RequestWithUser,
  ) {
    try {
      await this.captchaService.verify(body.captchaToken);
      return apiSuccess(
        "Registration status retrieved",
        await this.publicSite.checkRegistrationStatus(body.registrationNumber, body.phone, body.pin),
      );
    } catch (error) {
      const trimmed = body.registrationNumber.trim();
      const prefixMatch = trimmed.match(/^REG-\d{6}/);
      await this.auditService.record({
        ...getRequestMeta(request),
        action: "ppdb.check_status_failed",
        entity: "ppdb_registration",
        metadata: {
          registrationNumberPrefix: prefixMatch?.[0] ?? trimmed.slice(0, 10),
          reason: error instanceof UnauthorizedException ? "invalid_pin" : "not_found",
        },
      });
      throw error;
    }
  }

  @ApiOperation({ summary: "Set PPDB access PIN for legacy registrations" })
  @Post("ppdb/set-pin")
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async setPpdbPin(@Body(new ZodValidationPipe(publicPpdbSetPinSchema)) body: z.infer<typeof publicPpdbSetPinSchema>) {
    await this.captchaService.verify(body.captchaToken);
    return apiSuccess("PIN access configured", await this.publicSite.setAccessPin(body.registrationNumber, body.phone, body.pin));
  }
}
