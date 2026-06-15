import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
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
import { createInternshipSchema, internshipScoreSchema, updateInternshipSchema } from "./internships.dto";
import { InternshipsService } from "./internships.service";

@Controller("internships")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Internships")
@ApiBearerAuth()
export class InternshipsController {
  constructor(@Inject(InternshipsService) private readonly service: InternshipsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Internships list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("internships.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Internships retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Internships find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("internships.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Internship retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Internships create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("internships.create")
  async create(
    @Body(new ZodValidationPipe(createInternshipSchema.strict())) body: z.infer<typeof createInternshipSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Internship created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Internships update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("internships.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateInternshipSchema.strict())) body: z.infer<typeof updateInternshipSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Internship updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Internships delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("internships.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Internship deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Start" })
  @ApiResponse({ status: 200, description: "Internships start" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/start")
  @RequirePermissions("internships.start")
  async start(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Internship started", await this.service.start(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Complete" })
  @ApiResponse({ status: 200, description: "Internships complete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/complete")
  @RequirePermissions("internships.complete")
  async complete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Internship completed", await this.service.complete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Cancel" })
  @ApiResponse({ status: 200, description: "Internships cancel" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/cancel")
  @RequirePermissions("internships.cancel")
  async cancel(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Internship cancelled", await this.service.cancel(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Score" })
  @ApiResponse({ status: 200, description: "Internships score" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/score")
  @RequirePermissions("internships.score")
  async score(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(internshipScoreSchema.strict())) body: z.infer<typeof internshipScoreSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Internship scored", await this.service.score(id, body, user, getRequestMeta(request)));
  }
}
