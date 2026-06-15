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
import { createScheduleSchema, updateScheduleSchema } from "./schedules.dto";
import { SchedulesService } from "./schedules.service";

@Controller("schedules")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Schedules")
@ApiBearerAuth()
export class SchedulesController {
  constructor(@Inject(SchedulesService) private readonly service: SchedulesService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Schedules list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("schedules.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Schedules retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Classroom" })
  @ApiResponse({ status: 200, description: "Schedules find by classroom" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("classroom/:classroomId")
  @RequirePermissions("schedules.view")
  async findByClassroom(@Param("classroomId") classroomId: string) {
    return apiSuccess("Schedules retrieved", await this.service.findByClassroom(classroomId));
  }

  @ApiOperation({ summary: "Find By Teacher" })
  @ApiResponse({ status: 200, description: "Schedules find by teacher" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("teacher/:teacherId")
  @RequirePermissions("schedules.view")
  async findByTeacher(@Param("teacherId") teacherId: string) {
    return apiSuccess("Schedules retrieved", await this.service.findByTeacher(teacherId));
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Schedules find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("schedules.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Schedule retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Schedules create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("schedules.manage")
  async create(
    @Body(new ZodValidationPipe(createScheduleSchema.strict())) body: z.infer<typeof createScheduleSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Schedule created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Schedules update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("schedules.manage")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateScheduleSchema.strict())) body: z.infer<typeof updateScheduleSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Schedule updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Schedules delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("schedules.manage")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Schedule deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }
}
