import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
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
import { createInternshipLogSchema, rejectInternshipLogSchema, updateInternshipLogSchema } from "./internship-logs.dto";
import { InternshipLogsService } from "./internship-logs.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Internship Logs")
@ApiBearerAuth()
export class InternshipLogsController {
  constructor(@Inject(InternshipLogsService) private readonly service: InternshipLogsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Internship Logs list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("internships/:id/logs")
  @RequirePermissions("internship-logs.view")
  async list(@Param("id", ParseCuidPipe) id: string, @Query() query: unknown) {
    const result = await this.service.list(id, query);
    return apiSuccess("Internship logs retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Internship Logs create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("internships/:id/logs")
  @RequirePermissions("internship-logs.create")
  async create(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(createInternshipLogSchema.strict())) body: z.infer<typeof createInternshipLogSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Internship log created", await this.service.create(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Internship Logs update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("internship-logs/:logId")
  @RequirePermissions("internship-logs.update")
  async update(
    @Param("logId", ParseCuidPipe) logId: string,
    @Body(new ZodValidationPipe(updateInternshipLogSchema.strict())) body: z.infer<typeof updateInternshipLogSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Internship log updated", await this.service.update(logId, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Approve" })
  @ApiResponse({ status: 200, description: "Internship Logs approve" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("internship-logs/:logId/approve")
  @RequirePermissions("internship-logs.approve")
  async approve(@Param("logId", ParseCuidPipe) logId: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Internship log approved", await this.service.approve(logId, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reject" })
  @ApiResponse({ status: 200, description: "Internship Logs reject" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("internship-logs/:logId/reject")
  @RequirePermissions("internship-logs.reject")
  async reject(
    @Param("logId", ParseCuidPipe) logId: string,
    @Body(new ZodValidationPipe(rejectInternshipLogSchema.strict())) body: z.infer<typeof rejectInternshipLogSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Internship log rejected", await this.service.reject(logId, body, user, getRequestMeta(request)));
  }
}
