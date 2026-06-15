import { BadRequestException, Body, Controller, Get, Header, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";
import type { Response } from "express";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { PrintDocumentService } from "../pdf/print-document.service";
import { createSessionSchema, recordAttendanceSchema, updateSessionSchema } from "./attendance.dto";
import { AttendanceService } from "./attendance.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Attendance")
@ApiBearerAuth()
export class AttendanceController {
  constructor(
    @Inject(AttendanceService) private readonly service: AttendanceService,
    @Inject(PrintDocumentService) private readonly printService: PrintDocumentService,
  ) {}

  @ApiOperation({ summary: "List Sessions" })
  @ApiResponse({ status: 200, description: "Attendance list sessions" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("attendance/sessions")
  @RequirePermissions("attendance.view")
  async listSessions(@Query() query: unknown) {
    const result = await this.service.listSessions(query);
    return apiSuccess("Attendance sessions retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find Session By Id" })
  @ApiResponse({ status: 200, description: "Attendance find session by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("attendance/sessions/:id")
  @RequirePermissions("attendance.view")
  async findSessionById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Attendance session retrieved", await this.service.findSessionById(id));
  }

  @ApiOperation({ summary: "Create Session" })
  @ApiResponse({ status: 200, description: "Attendance create session" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("attendance/sessions")
  @RequirePermissions("attendance.record")
  async createSession(
    @Body(new ZodValidationPipe(createSessionSchema.strict())) body: z.infer<typeof createSessionSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Attendance session created", await this.service.createSession(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update Session" })
  @ApiResponse({ status: 200, description: "Attendance update session" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("attendance/sessions/:id")
  @RequirePermissions("attendance.update")
  async updateSession(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateSessionSchema.strict())) body: z.infer<typeof updateSessionSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Attendance session updated", await this.service.updateSession(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Record Attendance" })
  @ApiResponse({ status: 200, description: "Attendance record attendance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("attendance/sessions/:id/records")
  @RequirePermissions("attendance.record")
  async recordAttendance(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(recordAttendanceSchema.strict())) body: z.infer<typeof recordAttendanceSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Attendance recorded", await this.service.recordAttendance(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Get Student Summary" })
  @ApiResponse({ status: 200, description: "Attendance get student summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("attendance/students/:studentId/summary")
  @RequirePermissions("attendance.view")
  async getStudentSummary(@Param("studentId") studentId: string) {
    return apiSuccess("Attendance summary retrieved", await this.service.getStudentSummary(studentId));
  }

  @ApiOperation({ summary: "Get Classroom Summary" })
  @ApiResponse({ status: 200, description: "Attendance get classroom summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("attendance/classrooms/:classroomId/summary")
  @RequirePermissions("attendance.view")
  async getClassroomSummary(@Param("classroomId") classroomId: string) {
    return apiSuccess("Attendance summary retrieved", await this.service.getClassroomSummary(classroomId));
  }

  @ApiOperation({ summary: "Download Classroom Recap" })
  @ApiResponse({ status: 200, description: "Attendance download classroom recap" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("attendance/classrooms/:classroomId/recap.pdf")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("attendance.print")
  async downloadClassroomRecap(
    @Param("classroomId") classroomId: string,
    @Query("startDate") startDate: string | undefined,
    @Query("endDate") endDate: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException("startDate and endDate are required (ISO YYYY-MM-DD)");
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid startDate or endDate");
    }
    const buffer = await this.printService.renderAttendanceRecap(classroomId, start, end);
    await this.printService.logPrint("attendance.recap.print", "classroom", classroomId, user, getRequestMeta(request), {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="attendance-recap-${classroomId}.pdf"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.end(buffer);
  }
}
