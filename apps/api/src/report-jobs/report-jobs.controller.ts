import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { generateReportSchema } from "./report-jobs.dto";
import { ReportJobsService } from "./report-jobs.service";

@Controller("report-jobs")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Report Jobs")
@ApiBearerAuth()
export class ReportJobsController {
  constructor(@Inject(ReportJobsService) private readonly service: ReportJobsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Report Jobs list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("report-jobs.view")
  async list(@Query() query: unknown, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.list(query, user);
    return apiSuccess("Report jobs retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Generate" })
  @ApiResponse({ status: 200, description: "Report Jobs generate" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("report-jobs.create")
  async generate(
    @Body(new ZodValidationPipe(generateReportSchema.strict())) body: z.infer<typeof generateReportSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Report job generated", await this.service.generate(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Report Jobs find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("report-jobs.view")
  async findById(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Report job retrieved", await this.service.findById(id, user));
  }

  @ApiOperation({ summary: "Cancel" })
  @ApiResponse({ status: 200, description: "Report Jobs cancel" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/cancel")
  @RequirePermissions("report-jobs.cancel")
  async cancel(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Report job cancelled", await this.service.cancel(id, user, getRequestMeta(request)));
  }
}
