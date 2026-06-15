import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { StudentPortalService } from "./student-portal.service";

@Controller("student-portal")
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions("student-portal.view")
@ApiTags("Student Portal")
@ApiBearerAuth()
export class StudentPortalController {
  constructor(@Inject(StudentPortalService) private readonly service: StudentPortalService) {}

  @ApiOperation({ summary: "Summary" })
  @ApiResponse({ status: 200, description: "Student Portal summary" })
  @Get("summary")
  async summary(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Student portal summary retrieved", await this.service.getSummary(user.id));
  }

  @ApiOperation({ summary: "Profile" })
  @ApiResponse({ status: 200, description: "Student Portal profile" })
  @Get("profile")
  async profile(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Profile retrieved", await this.service.getProfile(user.id));
  }

  @ApiOperation({ summary: "Schedules" })
  @ApiResponse({ status: 200, description: "Student Portal schedules" })
  @Get("schedules")
  async schedules(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Schedules retrieved", await this.service.listSchedules(user.id));
  }

  @ApiOperation({ summary: "Attendance" })
  @ApiResponse({ status: 200, description: "Student Portal attendance" })
  @Get("attendance")
  async attendance(@CurrentUser() user: AuthenticatedUser, @Query("limit") limit?: string) {
    const parsed = limit ? Math.max(1, Math.min(200, Number(limit))) : 30;
    return apiSuccess("Attendance retrieved", await this.service.listAttendance(user.id, Number.isFinite(parsed) ? parsed : 30));
  }

  @ApiOperation({ summary: "Grades" })
  @ApiResponse({ status: 200, description: "Student Portal grades" })
  @Get("grades")
  async grades(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Grades retrieved", await this.service.listGrades(user.id));
  }

  @ApiOperation({ summary: "Invoices" })
  @ApiResponse({ status: 200, description: "Student Portal invoices" })
  @Get("invoices")
  async invoices(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Invoices retrieved", await this.service.listInvoices(user.id));
  }

  @ApiOperation({ summary: "Discipline" })
  @ApiResponse({ status: 200, description: "Student Portal discipline" })
  @Get("discipline")
  async discipline(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Student discipline summary retrieved", await this.service.getDisciplineSummary(user.id));
  }

  @ApiOperation({ summary: "Announcements" })
  @ApiResponse({ status: 200, description: "Student Portal announcements" })
  @Get("announcements")
  async announcements(@CurrentUser() user: AuthenticatedUser, @Query("limit") limit?: string) {
    const parsed = limit ? Math.max(1, Math.min(50, Number(limit))) : 10;
    return apiSuccess("Announcements retrieved", await this.service.listAnnouncements(user.id, Number.isFinite(parsed) ? parsed : 10));
  }

  @ApiOperation({ summary: "Notifications" })
  @ApiResponse({ status: 200, description: "Student Portal notifications" })
  @Get("notifications")
  async notifications(@CurrentUser() user: AuthenticatedUser, @Query("limit") limit?: string) {
    const parsed = limit ? Math.max(1, Math.min(100, Number(limit))) : 20;
    return apiSuccess("Notifications retrieved", await this.service.listNotifications(user.id, Number.isFinite(parsed) ? parsed : 20));
  }

  // Phase 10.5 — Student Dashboard
  @ApiOperation({ summary: "Dashboard" })
  @ApiResponse({ status: 200, description: "Student Portal dashboard" })
  @Get("dashboard")
  async dashboard(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Student portal dashboard retrieved", await this.service.getDashboard(user.id));
  }

  @ApiOperation({ summary: "Today Schedules" })
  @ApiResponse({ status: 200, description: "Student Portal today schedules" })
  @Get("today-schedules")
  async todaySchedules(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Student portal today schedules retrieved", await this.service.getTodaySchedules(user.id));
  }

  @ApiOperation({ summary: "Attendance Summary" })
  @ApiResponse({ status: 200, description: "Student Portal attendance summary" })
  @Get("attendance-summary")
  async attendanceSummary(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Student portal attendance summary retrieved", await this.service.getAttendanceSummary(user.id));
  }

  @ApiOperation({ summary: "Grade Summary" })
  @ApiResponse({ status: 200, description: "Student Portal grade summary" })
  @Get("grade-summary")
  async gradeSummary(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Student portal grade summary retrieved", await this.service.getGradeSummary(user.id));
  }

  @ApiOperation({ summary: "Invoice Summary" })
  @ApiResponse({ status: 200, description: "Student Portal invoice summary" })
  @Get("invoice-summary")
  async invoiceSummary(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Student portal invoice summary retrieved", await this.service.getInvoiceSummary(user.id));
  }

  @ApiOperation({ summary: "Recent Announcements" })
  @ApiResponse({ status: 200, description: "Student Portal recent announcements" })
  @Get("recent-announcements")
  async recentAnnouncements(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Student portal recent announcements retrieved", await this.service.getRecentAnnouncements(user.id));
  }
}
