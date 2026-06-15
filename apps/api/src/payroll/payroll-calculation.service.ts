import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class PayrollCalculationService {
  private readonly logger = new Logger(PayrollCalculationService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async calculatePeriod(periodId: string, userId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period || period.status !== "OPEN") {
      throw new BadRequestException("Payroll period must be OPEN to calculate");
    }

    // Get active employees
    const employees = await this.prisma.employeeProfile.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      include: {
        salaryComponents: {
          where: {
            isActive: true,
            deletedAt: null,
            OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: period.endDate } }],
            AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startDate } }] }],
          },
          include: { component: true },
        },
      },
    });

    for (const emp of employees) {
      await this.calculateEmployeeRun(periodId, emp, userId);
    }

    await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: "CALCULATED" },
    });
  }

  private async calculateEmployeeRun(periodId: string, employee: any, userId: string) {
    // Basic salary is the baseline earning
    const basicSalary = Number(employee.basicSalary || 0);

    let totalEarnings = basicSalary;
    let totalDeductions = 0;

    const runItems: any[] = [];

    // Add basic salary as a component item for tracking if > 0
    if (basicSalary > 0) {
      runItems.push({
        name: "Basic Salary",
        type: "EARNING",
        calculationType: "FIXED",
        amount: basicSalary,
      });
    }

    // Process each active component
    for (const sc of employee.salaryComponents) {
      const comp = sc.component;
      if (!comp || !comp.isActive) continue;

      const amount =
        comp.calculationType === "PERCENTAGE"
          ? (basicSalary * Number(sc.percentage ?? comp.defaultPercentage ?? 0)) / 100
          : Number(sc.amount ?? comp.defaultAmount ?? 0);

      if (amount <= 0) continue;

      runItems.push({
        componentId: comp.id,
        name: comp.name,
        type: comp.type,
        calculationType: comp.calculationType,
        amount: amount,
      });

      if (comp.type === "EARNING") {
        totalEarnings += amount;
      } else if (comp.type === "DEDUCTION") {
        totalDeductions += amount;
      }
    }

    let netAmount = totalEarnings - totalDeductions;
    if (netAmount < 0) {
      this.logger.warn(`Employee ${employee.employeeCode} has negative net amount: ${netAmount}`);
      netAmount = 0; // Prevent negative payouts in DB unless specifically allowed
    }

    // Upsert the PayrollRun
    const existingRun = await this.prisma.payrollRun.findUnique({
      where: { periodId_employeeId: { periodId, employeeId: employee.id } },
      include: { items: true },
    });

    if (existingRun) {
      await this.prisma.payrollRunItem.deleteMany({
        where: { payrollRunId: existingRun.id },
      });

      await this.prisma.payrollRun.update({
        where: { id: existingRun.id },
        data: {
          grossAmount: totalEarnings,
          totalEarnings,
          totalDeductions,
          netAmount,
          status: "CALCULATED",
          calculatedAt: new Date(),
          items: {
            create: runItems,
          },
        },
      });
    } else {
      await this.prisma.payrollRun.create({
        data: {
          periodId,
          employeeId: employee.id,
          status: "CALCULATED",
          grossAmount: totalEarnings,
          totalEarnings,
          totalDeductions,
          netAmount,
          calculatedAt: new Date(),
          items: {
            create: runItems,
          },
        },
      });
    }
  }
}
