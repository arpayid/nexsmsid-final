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
import { createTeachingAssignmentSchema, updateTeachingAssignmentSchema } from "./teaching-assignments.dto";
import { TeachingAssignmentsService } from "./teaching-assignments.service";

@Controller("teaching-assignments")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Teaching Assignments")
@ApiBearerAuth()
export class TeachingAssignmentsController {
  constructor(@Inject(TeachingAssignmentsService) private readonly service: TeachingAssignmentsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Teaching Assignments list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("teaching-assignments.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Teaching assignments retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Teaching Assignments find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("teaching-assignments.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Teaching assignment retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Teaching Assignments create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("teaching-assignments.manage")
  async create(
    @Body(new ZodValidationPipe(createTeachingAssignmentSchema.strict())) body: z.infer<typeof createTeachingAssignmentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Teaching assignment created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Teaching Assignments update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("teaching-assignments.manage")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateTeachingAssignmentSchema.strict())) body: z.infer<typeof updateTeachingAssignmentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Teaching assignment updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Teaching Assignments delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("teaching-assignments.manage")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Teaching assignment deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }
}
