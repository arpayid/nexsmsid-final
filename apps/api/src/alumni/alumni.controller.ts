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
import { createAlumniSchema, updateAlumniSchema } from "./alumni.dto";
import { AlumniService } from "./alumni.service";

@Controller("alumni")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Alumni")
@ApiBearerAuth()
export class AlumniController {
  constructor(@Inject(AlumniService) private readonly service: AlumniService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Alumni list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("alumni.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Alumni retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Alumni create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("alumni.create")
  async create(
    @Body(new ZodValidationPipe(createAlumniSchema.strict())) body: z.infer<typeof createAlumniSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Alumni created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Alumni find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("alumni.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Alumni retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Alumni update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("alumni.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateAlumniSchema.strict())) body: z.infer<typeof updateAlumniSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Alumni updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Alumni delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("alumni.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Alumni deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Convert From Student" })
  @ApiResponse({ status: 200, description: "Alumni convert from student" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("convert-from-student/:studentId")
  @RequirePermissions("alumni.convert")
  async convertFromStudent(
    @Param("studentId", ParseCuidPipe) studentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Student converted to alumni", await this.service.convertFromStudent(studentId, user, getRequestMeta(request)));
  }
}
