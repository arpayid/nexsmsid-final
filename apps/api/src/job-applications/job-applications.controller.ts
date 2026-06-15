import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";

import { z } from "zod";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { jobApplicationNoteSchema, updateJobApplicationSchema } from "./job-applications.dto";
import { JobApplicationsService } from "./job-applications.service";

@Controller("job-applications")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Job Applications")
@ApiBearerAuth()
export class JobApplicationsController {
  constructor(@Inject(JobApplicationsService) private readonly service: JobApplicationsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Job Applications list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("job-applications.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Job applications retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Job Applications find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/cv")
  @RequirePermissions("job-applications.view")
  async downloadCv(@Param("id", ParseCuidPipe) id: string, @Res() response: Response) {
    await this.service.streamCvByApplicationId(id, response);
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Job Applications find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("job-applications.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Job application retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Job Applications update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("job-applications.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateJobApplicationSchema.strict())) body: z.infer<typeof updateJobApplicationSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Job application updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Review" })
  @ApiResponse({ status: 200, description: "Job Applications review" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/review")
  @RequirePermissions("job-applications.review")
  async review(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Job application reviewed", await this.service.review(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Accept" })
  @ApiResponse({ status: 200, description: "Job Applications accept" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/accept")
  @RequirePermissions("job-applications.accept")
  async accept(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(jobApplicationNoteSchema.strict())) body: z.infer<typeof jobApplicationNoteSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Job application accepted", await this.service.accept(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reject" })
  @ApiResponse({ status: 200, description: "Job Applications reject" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/reject")
  @RequirePermissions("job-applications.reject")
  async reject(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(jobApplicationNoteSchema.strict())) body: z.infer<typeof jobApplicationNoteSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Job application rejected", await this.service.reject(id, body, user, getRequestMeta(request)));
  }
}
