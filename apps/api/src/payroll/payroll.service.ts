import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PayrollCalculationService } from "./payroll-calculation.service";
import { PayrollPdfService } from "./payroll-pdf.service";
import {
  CreatePayrollComponentDto,
  UpdatePayrollComponentDto,
  CreateEmployeeSalaryComponentDto,
  UpdateEmployeeSalaryComponentDto,
  CreatePayrollPeriodDto,
  UpdatePayrollPeriodDto,
  IssuePayslipDto,
  MarkPayslipPaidDto,
  UpdatePayrollRunDto,
} from "./payroll.dto";
import * as crypto from "crypto";

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly calcService: PayrollCalculationService,
    private readonly pdfService: PayrollPdfService,
  ) {}

  // =========================================================================
  // COMPONENTS
  // =========================================================================

  async getComponents(params: { page?: number; limit?: number; type?: string }) {
    const { page = 1, limit = 10, type } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (type) where.type = type;

    const [total, data] = await Promise.all([
      this.prisma.payrollComponent.count({ where }),
      this.prisma.payrollComponent.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { code: "asc" },
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getComponent(id: string) {
    const comp = await this.prisma.payrollComponent.findFirst({ where: { id, deletedAt: null } });
    if (!comp) throw new NotFoundException("Payroll component not found");
    return comp;
  }

  async createComponent(data: CreatePayrollComponentDto, userId: string) {
    const existing = await this.prisma.payrollComponent.findFirst({ where: { code: data.code, deletedAt: null } });
    if (existing) throw new BadRequestException("Component code already exists");

    const created = await this.prisma.payrollComponent.create({ data });
    await this.audit.record({
      actorId: userId,
      action: "payroll.component.create",
      entity: "Created payroll component",
      metadata: { componentId: created.id },
    });
    return created;
  }

  async updateComponent(id: string, data: UpdatePayrollComponentDto, userId: string) {
    await this.getComponent(id);
    const updated = await this.prisma.payrollComponent.update({ where: { id }, data });
    await this.audit.record({
      actorId: userId,
      action: "payroll.component.update",
      entity: "Updated payroll component",
      metadata: { componentId: id },
    });
    return updated;
  }

  async deleteComponent(id: string, userId: string) {
    await this.getComponent(id);
    await this.prisma.payrollComponent.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "payroll.component.delete",
      entity: "Deleted payroll component",
      metadata: { componentId: id },
    });
    return { success: true };
  }

  // =========================================================================
  // EMPLOYEE SALARY SETTINGS
  // =========================================================================

  async getEmployeeComponents(employeeId: string) {
    return this.prisma.employeeSalaryComponent.findMany({
      where: { employeeId, deletedAt: null },
      include: { component: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createEmployeeComponent(data: CreateEmployeeSalaryComponentDto, userId: string) {
    const created = await this.prisma.employeeSalaryComponent.create({
      data: {
        ...data,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      },
    });
    await this.audit.record({
      actorId: userId,
      action: "payroll.employee_component.create",
      entity: "Assigned component to employee",
      metadata: { escId: created.id },
    });
    return created;
  }

  async updateEmployeeComponent(id: string, data: UpdateEmployeeSalaryComponentDto, userId: string) {
    const existing = await this.prisma.employeeSalaryComponent.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Employee component not found");

    const updated = await this.prisma.employeeSalaryComponent.update({
      where: { id },
      data: {
        ...data,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      },
    });
    await this.audit.record({
      actorId: userId,
      action: "payroll.employee_component.update",
      entity: "Updated employee component",
      metadata: { escId: id },
    });
    return updated;
  }

  async deleteEmployeeComponent(id: string, userId: string) {
    const existing = await this.prisma.employeeSalaryComponent.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Employee component not found");

    await this.prisma.employeeSalaryComponent.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "payroll.employee_component.delete",
      entity: "Deleted employee component",
      metadata: { escId: id },
    });
    return { success: true };
  }

  // =========================================================================
  // PERIODS
  // =========================================================================

  async getPeriods(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (status) where.status = status;

    const [total, data] = await Promise.all([
      this.prisma.payrollPeriod.count({ where }),
      this.prisma.payrollPeriod.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { startDate: "desc" },
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getPeriod(id: string) {
    const period = await this.prisma.payrollPeriod.findFirst({ where: { id, deletedAt: null } });
    if (!period) throw new NotFoundException("Payroll period not found");
    return period;
  }

  async createPeriod(data: CreatePayrollPeriodDto, userId: string) {
    const existing = await this.prisma.payrollPeriod.findFirst({ where: { code: data.code, deletedAt: null } });
    if (existing) throw new BadRequestException("Period code already exists");

    const created = await this.prisma.payrollPeriod.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        createdById: userId,
      },
    });
    await this.audit.record({
      actorId: userId,
      action: "payroll.period.create",
      entity: "Created payroll period",
      metadata: { periodId: created.id },
    });
    return created;
  }

  async updatePeriod(id: string, data: UpdatePayrollPeriodDto, userId: string) {
    const period = await this.getPeriod(id);
    if (period.status !== "DRAFT") throw new BadRequestException("Can only update DRAFT periods");

    const updated = await this.prisma.payrollPeriod.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      },
    });
    await this.audit.record({
      actorId: userId,
      action: "payroll.period.update",
      entity: "Updated payroll period",
      metadata: { periodId: id },
    });
    return updated;
  }

  async openPeriod(id: string, userId: string) {
    const period = await this.getPeriod(id);
    if (period.status !== "DRAFT") throw new BadRequestException("Only DRAFT can be OPEN");

    const updated = await this.prisma.payrollPeriod.update({ where: { id }, data: { status: "OPEN" } });
    await this.audit.record({
      actorId: userId,
      action: "payroll.period.open",
      entity: "Opened payroll period",
      metadata: { periodId: id },
    });
    return updated;
  }

  async calculatePeriod(id: string, userId: string) {
    await this.calcService.calculatePeriod(id, userId);
    await this.audit.record({
      actorId: userId,
      action: "payroll.period.calculate",
      entity: "Calculated payroll period",
      metadata: { periodId: id },
    });
    return this.getPeriod(id);
  }

  async approvePeriod(id: string, userId: string) {
    const period = await this.getPeriod(id);
    if (period.status !== "CALCULATED") throw new BadRequestException("Only CALCULATED can be APPROVED");

    const updated = await this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: "APPROVED", approvedById: userId, approvedAt: new Date() },
    });

    await this.prisma.payrollApproval.create({
      data: {
        periodId: id,
        approverId: userId,
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    await this.prisma.payrollRun.updateMany({
      where: { periodId: id, deletedAt: null },
      data: { status: "APPROVED", approvedById: userId, approvedAt: new Date() },
    });

    await this.audit.record({
      actorId: userId,
      action: "payroll.period.approve",
      entity: "Approved payroll period",
      metadata: { periodId: id },
    });
    return updated;
  }

  async payPeriod(id: string, userId: string) {
    const period = await this.getPeriod(id);
    if (period.status !== "APPROVED") throw new BadRequestException("Only APPROVED can be PAID");

    const updated = await this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: "PAID" },
    });

    const runs = await this.prisma.payrollRun.findMany({ where: { periodId: id, deletedAt: null } });
    const paidAt = new Date();

    // Generate or mark payslips as paid when the full payroll period is paid.
    for (const run of runs) {
      await this.prisma.payrollRun.update({
        where: { id: run.id },
        data: { status: "PAID", paidById: userId, paidAt },
      });

      const psExists = await this.prisma.payslip.findFirst({ where: { payrollRunId: run.id } });
      if (psExists) {
        await this.prisma.payslip.update({
          where: { id: psExists.id },
          data: { status: "PAID", issuedAt: psExists.issuedAt ?? paidAt, paidAt },
        });
      } else {
        await this.prisma.payslip.create({
          data: {
            payrollRunId: run.id,
            payslipNumber: `PS-${period.code}-${run.employeeId.slice(0, 4).toUpperCase()}-${crypto.randomUUID().split("-")[0]}`,
            status: "PAID",
            issuedAt: paidAt,
            paidAt,
          },
        });
      }
    }

    await this.audit.record({ actorId: userId, action: "payroll.period.pay", entity: "Paid payroll period", metadata: { periodId: id } });
    return updated;
  }

  async closePeriod(id: string, userId: string) {
    const period = await this.getPeriod(id);
    if (period.status !== "PAID") throw new BadRequestException("Only PAID can be CLOSED");
    const updated = await this.prisma.payrollPeriod.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "payroll.period.close",
      entity: "Closed payroll period",
      metadata: { periodId: id },
    });
    return updated;
  }

  async cancelPeriod(id: string, userId: string) {
    const period = await this.getPeriod(id);
    if (["PAID", "CLOSED"].includes(period.status)) throw new BadRequestException("Cannot cancel PAID or CLOSED period");

    const updated = await this.prisma.payrollPeriod.update({ where: { id }, data: { status: "CANCELLED" } });
    await this.audit.record({
      actorId: userId,
      action: "payroll.period.cancel",
      entity: "Cancelled payroll period",
      metadata: { periodId: id },
    });
    return updated;
  }

  async deletePeriod(id: string, userId: string) {
    const period = await this.getPeriod(id);
    if (["APPROVED", "PAID", "CLOSED"].includes(period.status)) throw new BadRequestException("Cannot delete this period status");
    await this.prisma.payrollPeriod.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "payroll.period.delete",
      entity: "Deleted payroll period",
      metadata: { periodId: id },
    });
    return { success: true };
  }

  // =========================================================================
  // RUNS
  // =========================================================================

  async getRuns(params: { page?: number; limit?: number; periodId?: string; employeeId?: string }) {
    const { page = 1, limit = 10, periodId, employeeId } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (periodId) where.periodId = periodId;
    if (employeeId) where.employeeId = employeeId;

    const [total, data] = await Promise.all([
      this.prisma.payrollRun.count({ where }),
      this.prisma.payrollRun.findMany({
        where,
        include: { employee: { select: { fullName: true, employeeCode: true } } },
        skip,
        take: Number(limit),
        orderBy: { employee: { fullName: "asc" } },
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getRun(id: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, deletedAt: null },
      include: { employee: true, items: true, period: true },
    });
    if (!run) throw new NotFoundException("Payroll run not found");
    return run;
  }

  async updateRun(id: string, data: UpdatePayrollRunDto, userId: string) {
    const run = await this.getRun(id);
    if (run.status !== "CALCULATED") throw new BadRequestException("Only CALCULATED run can be manually adjusted");
    const updated = await this.prisma.payrollRun.update({
      where: { id },
      data,
    });
    await this.audit.record({ actorId: userId, action: "payroll.run.update", entity: "Updated payroll run", metadata: { runId: id } });
    return updated;
  }

  // =========================================================================
  // PAYSLIPS
  // =========================================================================

  async getPayslips(params: { page?: number; limit?: number; status?: string; payrollRunId?: string; periodId?: string }) {
    const { page = 1, limit = 10, status, payrollRunId, periodId } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (payrollRunId) where.payrollRunId = payrollRunId;
    if (periodId) where.payrollRun = { periodId };

    const [total, data] = await Promise.all([
      this.prisma.payslip.count({ where }),
      this.prisma.payslip.findMany({
        where,
        include: {
          payrollRun: {
            include: { employee: { select: { fullName: true, employeeCode: true } }, period: { select: { code: true, name: true } } },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { issuedAt: "desc" },
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getPayments(params: { page?: number; limit?: number; status?: string; periodId?: string }) {
    const { page = 1, limit = 10, status, periodId } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    where.status = status || { in: ["ISSUED", "PAID"] };
    if (periodId) where.payrollRun = { periodId };

    const [total, data] = await Promise.all([
      this.prisma.payslip.count({ where }),
      this.prisma.payslip.findMany({
        where,
        include: {
          payrollRun: {
            include: { employee: { select: { fullName: true, employeeCode: true } }, period: { select: { code: true, name: true } } },
          },
        },
        skip,
        take: Number(limit),
        orderBy: [{ paidAt: "desc" }, { issuedAt: "desc" }],
      }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getPayslip(id: string) {
    const ps = await this.prisma.payslip.findFirst({
      where: { id, deletedAt: null },
      include: { payrollRun: { include: { employee: true, period: true, items: true } } },
    });
    if (!ps) throw new NotFoundException("Payslip not found");
    return ps;
  }

  async getPayslipPdf(id: string) {
    return this.pdfService.generatePayslipPdf(id);
  }

  async markPayslipPaid(id: string, data: MarkPayslipPaidDto, userId: string) {
    const ps = await this.getPayslip(id);
    const paidAt = new Date();
    const updated = await this.prisma.payslip.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
      },
      include: { payrollRun: { include: { employee: true } } },
    });

    await this.prisma.payrollRun.update({
      where: { id: ps.payrollRunId },
      data: { status: "PAID", paidAt, paidById: userId },
    });

    const unpaidRuns = await this.prisma.payrollRun.count({
      where: { periodId: ps.payrollRun.periodId, deletedAt: null, status: { not: "PAID" } },
    });
    if (unpaidRuns === 0) {
      await this.prisma.payrollPeriod.update({ where: { id: ps.payrollRun.periodId }, data: { status: "PAID" } });
    }

    await this.audit.record({
      actorId: userId,
      action: "payroll.payslip.paid",
      entity: "Marked payslip as paid",
      metadata: { payslipId: id },
    });

    if (updated.payrollRun?.employee?.userId) {
      this.notifications
        .createSystemNotification({
          userId: updated.payrollRun.employee.userId,
          title: "Salary Paid",
          body: `Your salary for payslip ${updated.payslipNumber} has been marked as paid.`,
          channel: "IN_APP",
        })
        .catch((error) => {
          this.logger.warn(
            `Failed to send salary paid notification for user ${updated.payrollRun?.employee?.userId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }

    return updated;
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================

  async getSummary() {
    const currentPeriod = await this.prisma.payrollPeriod.findFirst({
      where: { status: { in: ["OPEN", "CALCULATED", "APPROVED", "PAID"] }, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    let totalGross = 0,
      totalDeductions = 0,
      totalNet = 0,
      runsCount = 0;
    if (currentPeriod) {
      const agg = await this.prisma.payrollRun.aggregate({
        where: { periodId: currentPeriod.id, deletedAt: null },
        _sum: { grossAmount: true, totalDeductions: true, netAmount: true },
        _count: true,
      });
      totalGross = Number(agg._sum.grossAmount || 0);
      totalDeductions = Number(agg._sum.totalDeductions || 0);
      totalNet = Number(agg._sum.netAmount || 0);
      runsCount = agg._count;
    }

    return {
      currentPeriod,
      totalGross,
      totalDeductions,
      totalNet,
      runsCount,
    };
  }
}
