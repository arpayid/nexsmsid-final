import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { HRService } from "./hr.service";
import { apiSuccess } from "../common/api-response";
import {
  CreateHRPositionDto,
  UpdateHRPositionDto,
  CreateEmployeeProfileDto,
  UpdateEmployeeProfileDto,
  CreateEmployeeAttendanceDto,
  UpdateEmployeeAttendanceDto,
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  RejectLeaveRequestDto,
} from "./hr.dto";

@Controller("hr")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Hr")
@ApiBearerAuth()
export class HRController {
  constructor(private readonly hrService: HRService) {}

  // =========================================================================
  // SUMMARY
  // =========================================================================

  @ApiOperation({ summary: "Get Summary" })
  @ApiResponse({ status: 200, description: "Hr get summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("payroll.view")
  async getSummary() {
    const data = await this.hrService.getSummary();
    return apiSuccess("HR summary retrieved", data);
  }

  // =========================================================================
  // POSITIONS
  // =========================================================================

  @ApiOperation({ summary: "Get Positions" })
  @ApiResponse({ status: 200, description: "Hr get positions" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("positions")
  @RequirePermissions("payroll.view")
  async getPositions(@Query() params: unknown) {
    const result = await this.hrService.getPositions(params as { page?: number; limit?: number; search?: string; isActive?: boolean });
    return apiSuccess("HR positions retrieved", result.data, result.meta);
  }

  @ApiOperation({ summary: "Create Position" })
  @ApiResponse({ status: 200, description: "Hr create position" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("positions")
  @RequirePermissions("payroll.create")
  async createPosition(@Body() data: CreateHRPositionDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.createPosition(data, user.id);
    return apiSuccess("HR position created", result);
  }

  @ApiOperation({ summary: "Get Position" })
  @ApiResponse({ status: 200, description: "Hr get position" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("positions/:id")
  @RequirePermissions("payroll.view")
  async getPosition(@Param("id", ParseCuidPipe) id: string) {
    const result = await this.hrService.getPosition(id);
    return apiSuccess("HR position retrieved", result);
  }

  @ApiOperation({ summary: "Update Position" })
  @ApiResponse({ status: 200, description: "Hr update position" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("positions/:id")
  @RequirePermissions("payroll.update")
  async updatePosition(@Param("id", ParseCuidPipe) id: string, @Body() data: UpdateHRPositionDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.updatePosition(id, data, user.id);
    return apiSuccess("HR position updated", result);
  }

  @ApiOperation({ summary: "Delete Position" })
  @ApiResponse({ status: 200, description: "Hr delete position" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("positions/:id")
  @RequirePermissions("payroll.update")
  async deletePosition(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.deletePosition(id, user.id);
    return apiSuccess("HR position deleted", result);
  }

  // =========================================================================
  // EMPLOYEES
  // =========================================================================

  @ApiOperation({ summary: "Get Employees" })
  @ApiResponse({ status: 200, description: "Hr get employees" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("employees")
  @RequirePermissions("payroll.view")
  async getEmployees(@Query() params: unknown) {
    const result = await this.hrService.getEmployees(
      params as {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        employmentType?: string;
        positionId?: string;
      },
    );
    return apiSuccess("Employees retrieved", result.data, result.meta);
  }

  @ApiOperation({ summary: "Create Employee" })
  @ApiResponse({ status: 200, description: "Hr create employee" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("employees")
  @RequirePermissions("payroll.create")
  async createEmployee(@Body() data: CreateEmployeeProfileDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.createEmployee(data, user.id);
    return apiSuccess("Employee created", result);
  }

  @ApiOperation({ summary: "Get Employee" })
  @ApiResponse({ status: 200, description: "Hr get employee" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("employees/:id")
  @RequirePermissions("payroll.view")
  async getEmployee(@Param("id", ParseCuidPipe) id: string) {
    const result = await this.hrService.getEmployee(id);
    return apiSuccess("Employee retrieved", result);
  }

  @ApiOperation({ summary: "Update Employee" })
  @ApiResponse({ status: 200, description: "Hr update employee" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("employees/:id")
  @RequirePermissions("payroll.update")
  async updateEmployee(
    @Param("id", ParseCuidPipe) id: string,
    @Body() data: UpdateEmployeeProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.hrService.updateEmployee(id, data, user.id);
    return apiSuccess("Employee updated", result);
  }

  @ApiOperation({ summary: "Delete Employee" })
  @ApiResponse({ status: 200, description: "Hr delete employee" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("employees/:id")
  @RequirePermissions("payroll.update")
  async deleteEmployee(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.deleteEmployee(id, user.id);
    return apiSuccess("Employee deleted", result);
  }

  // =========================================================================
  // ATTENDANCE
  // =========================================================================

  @ApiOperation({ summary: "Get Attendance" })
  @ApiResponse({ status: 200, description: "Hr get attendance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("attendance")
  @RequirePermissions("payroll.view")
  async getAttendance(@Query() params: unknown) {
    const result = await this.hrService.getAttendance(
      params as { page?: number; limit?: number; employeeId?: string; startDate?: string; endDate?: string },
    );
    return apiSuccess("Attendance records retrieved", result.data, result.meta);
  }

  @ApiOperation({ summary: "Create Attendance" })
  @ApiResponse({ status: 200, description: "Hr create attendance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("attendance")
  @RequirePermissions("payroll.create")
  async createAttendance(@Body() data: CreateEmployeeAttendanceDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.createAttendance(data, user.id);
    return apiSuccess("Attendance recorded", result);
  }

  @ApiOperation({ summary: "Update Attendance" })
  @ApiResponse({ status: 200, description: "Hr update attendance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("attendance/:id")
  @RequirePermissions("payroll.create")
  async updateAttendance(
    @Param("id", ParseCuidPipe) id: string,
    @Body() data: UpdateEmployeeAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.hrService.updateAttendance(id, data, user.id);
    return apiSuccess("Attendance updated", result);
  }

  @ApiOperation({ summary: "Delete Attendance" })
  @ApiResponse({ status: 200, description: "Hr delete attendance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("attendance/:id")
  @RequirePermissions("payroll.create")
  async deleteAttendance(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.deleteAttendance(id, user.id);
    return apiSuccess("Attendance deleted", result);
  }

  @ApiOperation({ summary: "Get Employee Attendance" })
  @ApiResponse({ status: 200, description: "Hr get employee attendance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("employees/:id/attendance")
  @RequirePermissions("payroll.view")
  async getEmployeeAttendance(@Param("id", ParseCuidPipe) id: string, @Query() params: unknown) {
    const result = await this.hrService.getAttendance({
      ...(params as { page?: number; limit?: number; startDate?: string; endDate?: string }),
      employeeId: id,
    });
    return apiSuccess("Employee attendance records retrieved", result.data, result.meta);
  }

  // =========================================================================
  // LEAVE REQUESTS
  // =========================================================================

  @ApiOperation({ summary: "Get Leave Requests" })
  @ApiResponse({ status: 200, description: "Hr get leave requests" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("leaves")
  @RequirePermissions("payroll.view")
  async getLeaveRequests(@Query() params: unknown) {
    const result = await this.hrService.getLeaveRequests(params as { page?: number; limit?: number; employeeId?: string; status?: string });
    return apiSuccess("Leave requests retrieved", result.data, result.meta);
  }

  @ApiOperation({ summary: "Create Leave Request" })
  @ApiResponse({ status: 200, description: "Hr create leave request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("leaves")
  @RequirePermissions("payroll.create")
  async createLeaveRequest(@Body() data: CreateLeaveRequestDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.createLeaveRequest(data, user.id);
    return apiSuccess("Leave request created", result);
  }

  @ApiOperation({ summary: "Get Leave Request" })
  @ApiResponse({ status: 200, description: "Hr get leave request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("leaves/:id")
  @RequirePermissions("payroll.view")
  async getLeaveRequest(@Param("id", ParseCuidPipe) id: string) {
    const result = await this.hrService.getLeaveRequest(id);
    return apiSuccess("Leave request retrieved", result);
  }

  @ApiOperation({ summary: "Update Leave Request" })
  @ApiResponse({ status: 200, description: "Hr update leave request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("leaves/:id")
  @RequirePermissions("payroll.create")
  async updateLeaveRequest(
    @Param("id", ParseCuidPipe) id: string,
    @Body() data: UpdateLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.hrService.updateLeaveRequest(id, data, user.id);
    return apiSuccess("Leave request updated", result);
  }

  @ApiOperation({ summary: "Approve Leave Request" })
  @ApiResponse({ status: 200, description: "Hr approve leave request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("leaves/:id/approve")
  @RequirePermissions("payroll.approve")
  async approveLeaveRequest(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.approveLeaveRequest(id, user.id);
    return apiSuccess("Leave request approved", result);
  }

  @ApiOperation({ summary: "Reject Leave Request" })
  @ApiResponse({ status: 200, description: "Hr reject leave request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("leaves/:id/reject")
  @RequirePermissions("payroll.approve")
  async rejectLeaveRequest(
    @Param("id", ParseCuidPipe) id: string,
    @Body() data: RejectLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.hrService.rejectLeaveRequest(id, data, user.id);
    return apiSuccess("Leave request rejected", result);
  }

  @ApiOperation({ summary: "Cancel Leave Request" })
  @ApiResponse({ status: 200, description: "Hr cancel leave request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("leaves/:id/cancel")
  @RequirePermissions("payroll.create")
  async cancelLeaveRequest(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.cancelLeaveRequest(id, user.id);
    return apiSuccess("Leave request cancelled", result);
  }

  @ApiOperation({ summary: "Delete Leave Request" })
  @ApiResponse({ status: 200, description: "Hr delete leave request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("leaves/:id")
  @RequirePermissions("payroll.update")
  async deleteLeaveRequest(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrService.deleteLeaveRequest(id, user.id);
    return apiSuccess("Leave request deleted", result);
  }
}
