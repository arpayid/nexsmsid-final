import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { PayrollService } from "./payroll.service";
import { apiSuccess } from "../common/api-response";
import { Response } from "express";
import {
  CreatePayrollComponentDto,
  UpdatePayrollComponentDto,
  CreateEmployeeSalaryComponentDto,
  UpdateEmployeeSalaryComponentDto,
  CreatePayrollPeriodDto,
  UpdatePayrollPeriodDto,
  MarkPayslipPaidDto,
  UpdatePayrollRunDto,
} from "./payroll.dto";

@Controller("payroll")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Payroll")
@ApiBearerAuth()
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // =========================================================================
  // SUMMARY
  // =========================================================================

  @ApiOperation({ summary: "Get Summary" })
  @ApiResponse({ status: 200, description: "Payroll get summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("payroll.view")
  async getSummary() {
    const data = await this.payrollService.getSummary();
    return apiSuccess("Payroll summary retrieved", data);
  }

  // =========================================================================
  // COMPONENTS
  // =========================================================================

  @ApiOperation({ summary: "Get Components" })
  @ApiResponse({ status: 200, description: "Payroll get components" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("components")
  @RequirePermissions("payroll.view")
  async getComponents(@Query() params: unknown) {
    const result = await this.payrollService.getComponents(params as { page?: number; limit?: number; type?: string });
    return apiSuccess("Payroll components retrieved", result.data, result.meta);
  }

  @ApiOperation({ summary: "Create Component" })
  @ApiResponse({ status: 200, description: "Payroll create component" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("components")
  @RequirePermissions("payroll.create")
  async createComponent(@Body() data: CreatePayrollComponentDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.createComponent(data, user.id);
    return apiSuccess("Payroll component created", result);
  }

  @ApiOperation({ summary: "Get Component" })
  @ApiResponse({ status: 200, description: "Payroll get component" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("components/:id")
  @RequirePermissions("payroll.view")
  async getComponent(@Param("id", ParseCuidPipe) id: string) {
    const result = await this.payrollService.getComponent(id);
    return apiSuccess("Payroll component retrieved", result);
  }

  @ApiOperation({ summary: "Update Component" })
  @ApiResponse({ status: 200, description: "Payroll update component" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("components/:id")
  @RequirePermissions("payroll.update")
  async updateComponent(
    @Param("id", ParseCuidPipe) id: string,
    @Body() data: UpdatePayrollComponentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.payrollService.updateComponent(id, data, user.id);
    return apiSuccess("Payroll component updated", result);
  }

  @ApiOperation({ summary: "Delete Component" })
  @ApiResponse({ status: 200, description: "Payroll delete component" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("components/:id")
  @RequirePermissions("payroll.update")
  async deleteComponent(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.deleteComponent(id, user.id);
    return apiSuccess("Payroll component deleted", result);
  }

  // =========================================================================
  // EMPLOYEE SALARY SETTINGS
  // =========================================================================

  @ApiOperation({ summary: "Get Employee Components" })
  @ApiResponse({ status: 200, description: "Payroll get employee components" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("employees/:employeeId/components")
  @RequirePermissions("payroll.view")
  async getEmployeeComponents(@Param("employeeId") employeeId: string) {
    const result = await this.payrollService.getEmployeeComponents(employeeId);
    return apiSuccess("Employee salary components retrieved", result);
  }

  @ApiOperation({ summary: "Create Employee Component" })
  @ApiResponse({ status: 200, description: "Payroll create employee component" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("employee-components")
  @RequirePermissions("payroll.create")
  async createEmployeeComponent(@Body() data: CreateEmployeeSalaryComponentDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.createEmployeeComponent(data, user.id);
    return apiSuccess("Employee salary component created", result);
  }

  @ApiOperation({ summary: "Update Employee Component" })
  @ApiResponse({ status: 200, description: "Payroll update employee component" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("employee-components/:id")
  @RequirePermissions("payroll.update")
  async updateEmployeeComponent(
    @Param("id", ParseCuidPipe) id: string,
    @Body() data: UpdateEmployeeSalaryComponentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.payrollService.updateEmployeeComponent(id, data, user.id);
    return apiSuccess("Employee salary component updated", result);
  }

  @ApiOperation({ summary: "Delete Employee Component" })
  @ApiResponse({ status: 200, description: "Payroll delete employee component" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("employee-components/:id")
  @RequirePermissions("payroll.update")
  async deleteEmployeeComponent(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.deleteEmployeeComponent(id, user.id);
    return apiSuccess("Employee salary component deleted", result);
  }

  // =========================================================================
  // PERIODS
  // =========================================================================

  @ApiOperation({ summary: "Get Periods" })
  @ApiResponse({ status: 200, description: "Payroll get periods" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("periods")
  @RequirePermissions("payroll.view")
  async getPeriods(@Query() params: unknown) {
    const result = await this.payrollService.getPeriods(params as { page?: number; limit?: number; status?: string });
    return apiSuccess("Payroll periods retrieved", result.data, result.meta);
  }

  @ApiOperation({ summary: "Create Period" })
  @ApiResponse({ status: 200, description: "Payroll create period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("periods")
  @RequirePermissions("payroll.create")
  async createPeriod(@Body() data: CreatePayrollPeriodDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.createPeriod(data, user.id);
    return apiSuccess("Payroll period created", result);
  }

  @ApiOperation({ summary: "Get Period" })
  @ApiResponse({ status: 200, description: "Payroll get period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("periods/:id")
  @RequirePermissions("payroll.view")
  async getPeriod(@Param("id", ParseCuidPipe) id: string) {
    const result = await this.payrollService.getPeriod(id);
    return apiSuccess("Payroll period retrieved", result);
  }

  @ApiOperation({ summary: "Update Period" })
  @ApiResponse({ status: 200, description: "Payroll update period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("periods/:id")
  @RequirePermissions("payroll.update")
  async updatePeriod(@Param("id", ParseCuidPipe) id: string, @Body() data: UpdatePayrollPeriodDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.updatePeriod(id, data, user.id);
    return apiSuccess("Payroll period updated", result);
  }

  @ApiOperation({ summary: "Delete Period" })
  @ApiResponse({ status: 200, description: "Payroll delete period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("periods/:id")
  @RequirePermissions("payroll.update")
  async deletePeriod(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.deletePeriod(id, user.id);
    return apiSuccess("Payroll period deleted", result);
  }

  @ApiOperation({ summary: "Open Period" })
  @ApiResponse({ status: 200, description: "Payroll open period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("periods/:id/open")
  @RequirePermissions("payroll.update")
  async openPeriod(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.openPeriod(id, user.id);
    return apiSuccess("Payroll period opened", result);
  }

  @ApiOperation({ summary: "Calculate Period" })
  @ApiResponse({ status: 200, description: "Payroll calculate period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("periods/:id/calculate")
  @RequirePermissions("payroll.create")
  async calculatePeriod(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.calculatePeriod(id, user.id);
    return apiSuccess("Payroll period calculated", result);
  }

  @ApiOperation({ summary: "Approve Period" })
  @ApiResponse({ status: 200, description: "Payroll approve period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("periods/:id/approve")
  @RequirePermissions("payroll.approve")
  async approvePeriod(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.approvePeriod(id, user.id);
    return apiSuccess("Payroll period approved", result);
  }

  @ApiOperation({ summary: "Pay Period" })
  @ApiResponse({ status: 200, description: "Payroll pay period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("periods/:id/pay")
  @RequirePermissions("payroll.pay")
  async payPeriod(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.payPeriod(id, user.id);
    return apiSuccess("Payroll period paid", result);
  }

  @ApiOperation({ summary: "Close Period" })
  @ApiResponse({ status: 200, description: "Payroll close period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("periods/:id/close")
  @RequirePermissions("payroll.update")
  async closePeriod(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.closePeriod(id, user.id);
    return apiSuccess("Payroll period closed", result);
  }

  @ApiOperation({ summary: "Cancel Period" })
  @ApiResponse({ status: 200, description: "Payroll cancel period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("periods/:id/cancel")
  @RequirePermissions("payroll.update")
  async cancelPeriod(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.cancelPeriod(id, user.id);
    return apiSuccess("Payroll period cancelled", result);
  }

  // =========================================================================
  // RUNS
  // =========================================================================

  @ApiOperation({ summary: "Get Runs" })
  @ApiResponse({ status: 200, description: "Payroll get runs" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("runs")
  @RequirePermissions("payroll.view")
  async getRuns(@Query() params: unknown) {
    const result = await this.payrollService.getRuns(params as { page?: number; limit?: number; periodId?: string; employeeId?: string });
    return apiSuccess("Payroll runs retrieved", result.data, result.meta);
  }

  @ApiOperation({ summary: "Get Run" })
  @ApiResponse({ status: 200, description: "Payroll get run" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("runs/:id")
  @RequirePermissions("payroll.view")
  async getRun(@Param("id", ParseCuidPipe) id: string) {
    const result = await this.payrollService.getRun(id);
    return apiSuccess("Payroll run retrieved", result);
  }

  @ApiOperation({ summary: "Update Run" })
  @ApiResponse({ status: 200, description: "Payroll update run" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("runs/:id")
  @RequirePermissions("payroll.update")
  async updateRun(@Param("id", ParseCuidPipe) id: string, @Body() data: UpdatePayrollRunDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.updateRun(id, data, user.id);
    return apiSuccess("Payroll run updated", result);
  }

  // =========================================================================
  // PAYSLIPS
  // =========================================================================

  @ApiOperation({ summary: "Get Payslips" })
  @ApiResponse({ status: 200, description: "Payroll get payslips" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("payslips")
  @RequirePermissions("payroll.view")
  async getPayslips(@Query() params: unknown) {
    const result = await this.payrollService.getPayslips(
      params as { page?: number; limit?: number; status?: string; payrollRunId?: string; periodId?: string },
    );
    return apiSuccess("Payslips retrieved", result.data, result.meta);
  }

  // =========================================================================
  // PAYMENTS
  // =========================================================================

  @ApiOperation({ summary: "Get Payments" })
  @ApiResponse({ status: 200, description: "Payroll get payments" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("payments")
  @RequirePermissions("payroll.pay")
  async getPayments(@Query() params: unknown) {
    const result = await this.payrollService.getPayments(params as { page?: number; limit?: number; status?: string; periodId?: string });
    return apiSuccess("Payments retrieved", result.data, result.meta);
  }

  @ApiOperation({ summary: "Get Payslip" })
  @ApiResponse({ status: 200, description: "Payroll get payslip" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("payslips/:id")
  @RequirePermissions("payroll.view")
  async getPayslip(@Param("id", ParseCuidPipe) id: string) {
    const result = await this.payrollService.getPayslip(id);
    return apiSuccess("Payslip retrieved", result);
  }

  @ApiOperation({ summary: "Mark Payslip Paid" })
  @ApiResponse({ status: 200, description: "Payroll mark payslip paid" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("payslips/:id/mark-paid")
  @RequirePermissions("payroll.pay")
  async markPayslipPaid(@Param("id", ParseCuidPipe) id: string, @Body() data: MarkPayslipPaidDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.payrollService.markPayslipPaid(id, data, user.id);
    return apiSuccess("Payslip marked as paid", result);
  }

  @ApiOperation({ summary: "Download Payslip Pdf" })
  @ApiResponse({ status: 200, description: "Payroll download payslip pdf" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("payslips/:id/pdf")
  @RequirePermissions("payroll.print")
  async downloadPayslipPdf(@Param("id", ParseCuidPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.payrollService.getPayslipPdf(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=payslip-${id}.pdf`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
