import { Body, Controller, Get, Inject, Param, Post, Req, Res, UseGuards, NotFoundException, ForbiddenException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";
import { Response } from "express";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import * as path from "path";
import * as fs from "fs";

import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { ReportJobsService } from "../report-jobs/report-jobs.service";
import { ReportCenterService } from "./report-center.service";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { generateReportSchema } from "../report-jobs/report-jobs.dto";

@Controller("reports")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Report Center")
@ApiBearerAuth()
export class ReportCenterController {
  constructor(
    @Inject(ReportCenterService) private readonly service: ReportCenterService,
    @Inject(ReportJobsService) private readonly reportJobsService: ReportJobsService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @ApiOperation({ summary: "Types" })
  @ApiResponse({ status: 200, description: "Report Center types" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("types")
  @RequirePermissions("reports.view")
  async types() {
    return apiSuccess("Report types retrieved", await this.service.getReportTypes());
  }

  @ApiOperation({ summary: "Summary" })
  @ApiResponse({ status: 200, description: "Report Center summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("reports.view")
  async summary() {
    return apiSuccess("Report center summary retrieved", await this.service.summary());
  }

  @ApiOperation({ summary: "Generate" })
  @ApiResponse({ status: 200, description: "Report Center generate" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("generate")
  @RequirePermissions("reports.generate")
  async generate(
    @Body(new ZodValidationPipe(generateReportSchema.strict())) body: z.infer<typeof generateReportSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Report generated", await this.reportJobsService.generate(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Download" })
  @ApiResponse({ status: 200, description: "Report Center download" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("download/:reportJobId")
  @RequirePermissions("reports.download")
  async download(
    @Param("reportJobId") reportJobId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const job = await this.prisma.reportJob.findUnique({ where: { id: reportJobId } });
    if (!job) throw new NotFoundException("Report job not found");
    if (job.status !== "COMPLETED") throw new ForbiddenException("Report is not ready for download");

    // Owner-scoped: only the requester or a super-admin can download the file
    if (!user.roles.includes("super-admin") && job.requestedById !== user.id) {
      throw new NotFoundException("Report job not found");
    }

    const fileName = `${job.type.toLowerCase()}-${job.id}.${job.format.toLowerCase()}`;
    const filePath = path.join(process.cwd(), "storage", "reports", fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException("Report file not found on server");
    }

    await this.audit.record({
      actorId: user.id,
      action: "report.download",
      entity: "ReportJob",
      entityId: job.id,
      metadata: { type: job.type, format: job.format },
      ...getRequestMeta(request),
    });

    res.download(filePath, fileName);
  }
}
