import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { AuthenticatedUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { TeacherPortalService } from "./teacher-portal.service";

@Controller("teacher-portal")
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions("teacher-portal.view")
@ApiTags("Teacher Portal")
@ApiBearerAuth()
export class TeacherPortalController {
  constructor(@Inject(TeacherPortalService) private readonly service: TeacherPortalService) {}

  @ApiOperation({ summary: "Summary" })
  @ApiResponse({ status: 200, description: "Teacher Portal summary" })
  @Get("summary")
  async summary(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Teacher portal summary retrieved", await this.service.getSummary(user.id));
  }

  @ApiOperation({ summary: "Teaching Assignments" })
  @ApiResponse({ status: 200, description: "Teacher Portal teaching assignments" })
  @Get("teaching-assignments")
  async teachingAssignments(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Teaching assignments retrieved", await this.service.listTeachingAssignments(user.id));
  }

  @ApiOperation({ summary: "Schedules" })
  @ApiResponse({ status: 200, description: "Teacher Portal schedules" })
  @Get("schedules")
  async schedules(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Schedules retrieved", await this.service.listSchedules(user.id));
  }

  @ApiOperation({ summary: "Attendance Sessions" })
  @ApiResponse({ status: 200, description: "Teacher Portal attendance sessions" })
  @Get("attendance-sessions")
  async attendanceSessions(@CurrentUser() user: AuthenticatedUser, @Query("limit") limit?: string) {
    const parsed = limit ? Math.max(1, Math.min(100, Number(limit))) : 20;
    return apiSuccess(
      "Attendance sessions retrieved",
      await this.service.listAttendanceSessions(user.id, Number.isFinite(parsed) ? parsed : 20),
    );
  }

  @ApiOperation({ summary: "Assessments" })
  @ApiResponse({ status: 200, description: "Teacher Portal assessments" })
  @Get("assessments")
  async assessments(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Assessments retrieved", await this.service.listAssessments(user.id));
  }

  @ApiOperation({ summary: "Get Notifications" })
  @ApiResponse({ status: 200, description: "Teacher Portal get notifications" })
  @Get("notifications")
  async getNotifications(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Teacher portal notifications retrieved", await this.service.listNotifications(user.id));
  }

  // Phase 10.5 — Teacher Dashboard
  @ApiOperation({ summary: "Get Dashboard" })
  @ApiResponse({ status: 200, description: "Teacher Portal get dashboard" })
  @Get("dashboard")
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Teacher portal dashboard retrieved", await this.service.getDashboard(user.id));
  }

  @ApiOperation({ summary: "Get Today Schedules" })
  @ApiResponse({ status: 200, description: "Teacher Portal get today schedules" })
  @Get("today-schedules")
  async getTodaySchedules(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Teacher portal today schedules retrieved", await this.service.getTodaySchedules(user.id));
  }

  @ApiOperation({ summary: "Get Pending Attendance" })
  @ApiResponse({ status: 200, description: "Teacher Portal get pending attendance" })
  @Get("pending-attendance")
  async getPendingAttendance(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Teacher portal pending attendance retrieved", await this.service.getPendingAttendance(user.id));
  }

  @ApiOperation({ summary: "Get Pending Grades" })
  @ApiResponse({ status: 200, description: "Teacher Portal get pending grades" })
  @Get("pending-grades")
  async getPendingGrades(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Teacher portal pending grades retrieved", await this.service.getPendingGrades(user.id));
  }

  @ApiOperation({ summary: "Get Recent Notifications" })
  @ApiResponse({ status: 200, description: "Teacher Portal get recent notifications" })
  @Get("recent-notifications")
  async getRecentNotifications(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Teacher portal recent notifications retrieved", await this.service.getRecentNotifications(user.id));
  }
}
