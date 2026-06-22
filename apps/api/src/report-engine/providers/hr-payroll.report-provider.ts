import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ReportDataResult } from "../report-engine.types";
import { ReportProvider, ReportFilters, filterString, hasFilter, formatReportDate } from "../report-provider.interface";

@Injectable()
export class HrPayrollReportProvider implements ReportProvider {
  readonly reports: Record<string, (f: ReportFilters) => Promise<ReportDataResult>>;

  constructor(private prisma: PrismaService) {
    this.reports = {
      "hr-employee-recap": this.getHrEmployeeRecap.bind(this),
      "hr-attendance-recap": this.getHrAttendanceRecap.bind(this),
      "hr-leave-recap": this.getHrLeaveRecap.bind(this),
      "payroll-period-recap": this.getPayrollPeriodRecap.bind(this),
      "payroll-run-recap": this.getPayrollRunRecap.bind(this),
      "payroll-component-recap": this.getPayrollComponentRecap.bind(this),
      "payroll-payment-recap": this.getPayrollPaymentRecap.bind(this),
    };
  }

  supportedReports(): string[] {
    return Object.keys(this.reports);
  }
  async getData(reportCode: string, filters: ReportFilters): Promise<ReportDataResult> {
    const fn = this.reports[reportCode];
    if (!fn) throw new Error(`Report ${reportCode} not handled by HrPayrollReportProvider`);
    return fn(filters);
  }

  private async getHrEmployeeRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: any = { deletedAt: null };
    if (hasFilter(f, "status")) where.status = f.status;
    if (filterString(f, "positionId")) where.positionId = filterString(f, "positionId");
    const items = await (this.prisma as any).employee.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { position: true, user: { select: { name: true, email: true } } },
      orderBy: { name: "asc" },
    });
    return {
      title: "HR Employee Recap",
      columns: [
        { key: "nip", label: "NIP", width: 20 },
        { key: "name", label: "Name", width: 30 },
        { key: "position", label: "Position", width: 20 },
        { key: "type", label: "Type", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i: any) => ({
        nip: i.nip,
        name: i.name,
        position: i.position?.name || "-",
        type: i.employeeType,
        status: i.status,
      })),
    };
  }

  private async getHrAttendanceRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: any = {};
    if (filterString(f, "startDate") && filterString(f, "endDate"))
      where.date = { gte: new Date(String(f.startDate)), lte: new Date(String(f.endDate)) };
    if (filterString(f, "employeeId")) where.employeeId = filterString(f, "employeeId");
    const items = await (this.prisma as any).employeeAttendance.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { employee: true },
      orderBy: { date: "desc" },
    });
    return {
      title: "HR Attendance Recap",
      columns: [
        { key: "nip", label: "NIP", width: 15 },
        { key: "name", label: "Employee", width: 30 },
        { key: "date", label: "Date", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i: any) => ({
        nip: i.employee.nip,
        name: i.employee.name,
        date: i.date.toISOString().split("T")[0],
        status: i.status,
      })),
    };
  }

  private async getHrLeaveRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: any = { deletedAt: null };
    if (hasFilter(f, "status")) where.status = f.status;
    if (filterString(f, "employeeId")) where.employeeId = filterString(f, "employeeId");
    const items = await (this.prisma as any).leaveRequest.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { employee: true, approvedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "HR Leave Recap",
      columns: [
        { key: "nip", label: "NIP", width: 15 },
        { key: "name", label: "Employee", width: 30 },
        { key: "type", label: "Type", width: 15 },
        { key: "start", label: "Start", width: 15 },
        { key: "end", label: "End", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i: any) => ({
        nip: i.employee.nip,
        name: i.employee.name,
        type: i.leaveType,
        start: i.startDate.toISOString().split("T")[0],
        end: i.endDate.toISOString().split("T")[0],
        status: i.status,
      })),
    };
  }

  private async getPayrollPeriodRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.payrollPeriod.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      orderBy: { startDate: "desc" },
    });
    return {
      title: "Payroll Period Recap",
      columns: [
        { key: "name", label: "Period", width: 25 },
        { key: "start", label: "Start", width: 15 },
        { key: "end", label: "End", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i) => ({
        name: i.name,
        start: i.startDate.toISOString().split("T")[0],
        end: i.endDate.toISOString().split("T")[0],
        status: i.status,
      })),
    };
  }

  private async getPayrollRunRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.payrollRun.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { period: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Payroll Run Recap",
      columns: [
        { key: "period", label: "Period", width: 25 },
        { key: "total", label: "Total Employee", width: 15 },
        { key: "amount", label: "Total Amount", width: 20 },
        { key: "status", label: "Status", width: 15 },
        { key: "date", label: "Processed", width: 15 },
      ],
      rows: items.map((i: any) => ({
        period: i.period?.name || "-",
        total: i.totalEmployee,
        amount: Number(i.totalAmount),
        status: i.status,
        date: i.createdAt.toISOString().split("T")[0],
      })),
    };
  }

  private async getPayrollComponentRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.payrollComponent.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return {
      title: "Payroll Component Recap",
      columns: [
        { key: "name", label: "Component", width: 25 },
        { key: "type", label: "Type", width: 15 },
        { key: "amount", label: "Default Amount", width: 15 },
      ],
      rows: items.map((i) => ({ name: i.name, type: i.type, amount: Number(i.defaultAmount) })),
    };
  }

  private async getPayrollPaymentRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await (this.prisma as any).payrollPayment.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { run: { include: { period: true } }, employee: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Payroll Payment Recap",
      columns: [
        { key: "nip", label: "NIP", width: 15 },
        { key: "employee", label: "Employee", width: 30 },
        { key: "period", label: "Period", width: 20 },
        { key: "amount", label: "Amount", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i: any) => ({
        nip: i.employee.nip,
        employee: i.employee.name,
        period: i.run.period?.name || "-",
        amount: Number(i.netAmount),
        status: i.status,
      })),
    };
  }
}
