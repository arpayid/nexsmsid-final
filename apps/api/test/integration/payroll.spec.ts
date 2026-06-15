import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { adminToken, db, get, post } from "./helpers";

/**
 * Exercises the full payroll lifecycle against seeded HR data:
 * 3 ACTIVE employees, each assigned GAPOK (5,000,000), TUNJANGAN (1,500,000),
 * TRANSPORT (500,000) as fixed earnings plus POTONGAN (2%) and PAJAK (5%)
 * percentage deductions computed over basicSalary.
 */
describe("payroll (integration)", () => {
  let token: string;
  let salariedEmployeeId: string;
  let activeEmployeeCount: number;

  const BASIC_SALARY = 4_000_000;
  const FIXED_COMPONENTS = 5_000_000 + 1_500_000 + 500_000;

  beforeAll(async () => {
    token = await adminToken();

    const employee = await db.employeeProfile.findFirstOrThrow({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: { employeeCode: "asc" },
    });
    salariedEmployeeId = employee.id;
    await db.employeeProfile.update({ where: { id: employee.id }, data: { basicSalary: BASIC_SALARY } });

    activeEmployeeCount = await db.employeeProfile.count({ where: { status: "ACTIVE", deletedAt: null } });
    expect(activeEmployeeCount).toBeGreaterThanOrEqual(2);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("runs the full period lifecycle with exact calculations", async () => {
    const created = await post(
      "payroll/periods",
      {
        code: "ITEST-2099-01",
        name: "Integration Test Periode Jan 2099",
        month: 1,
        year: 2099,
        startDate: "2099-01-01",
        endDate: "2099-01-31",
      },
      token,
    );
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("DRAFT");
    const periodId = created.body.data.id as string;

    // State machine: cannot calculate a DRAFT period
    const premature = await post(`payroll/periods/${periodId}/calculate`, {}, token);
    expect(premature.status).toBe(400);

    const opened = await post(`payroll/periods/${periodId}/open`, {}, token);
    expect(opened.status).toBe(201);
    expect(opened.body.data.status).toBe("OPEN");

    const calculated = await post(`payroll/periods/${periodId}/calculate`, {}, token);
    expect(calculated.status).toBe(201);
    expect(calculated.body.data.status).toBe("CALCULATED");

    const runsRes = await get(`payroll/runs?periodId=${periodId}&limit=50`, token);
    expect(runsRes.status).toBe(200);
    const runs = runsRes.body.data as Array<{
      employeeId: string;
      status: string;
      grossAmount: unknown;
      totalDeductions: unknown;
      netAmount: unknown;
    }>;
    // One run per ACTIVE employee
    expect(runs.length).toBe(activeEmployeeCount);

    // Employee with basicSalary: percentage deductions apply over it
    const salaried = runs.find((r) => r.employeeId === salariedEmployeeId);
    expect(salaried).toBeDefined();
    expect(Number(salaried!.grossAmount)).toBe(BASIC_SALARY + FIXED_COMPONENTS); // 11,000,000
    expect(Number(salaried!.totalDeductions)).toBe(BASIC_SALARY * 0.02 + BASIC_SALARY * 0.05); // 280,000
    expect(Number(salaried!.netAmount)).toBe(BASIC_SALARY + FIXED_COMPONENTS - 280_000); // 10,720,000

    // Employees without basicSalary: only fixed components, no percentage deductions
    for (const run of runs.filter((r) => r.employeeId !== salariedEmployeeId)) {
      expect(Number(run.grossAmount)).toBe(FIXED_COMPONENTS); // 7,000,000
      expect(Number(run.totalDeductions)).toBe(0);
      expect(Number(run.netAmount)).toBe(FIXED_COMPONENTS);
    }

    const approved = await post(`payroll/periods/${periodId}/approve`, {}, token);
    expect(approved.status).toBe(201);
    expect(approved.body.data.status).toBe("APPROVED");

    const paid = await post(`payroll/periods/${periodId}/pay`, {}, token);
    expect(paid.status).toBe(201);
    expect(paid.body.data.status).toBe("PAID");

    // Paying the period produces a PAID payslip per run
    const payslips = await db.payslip.findMany({ where: { payrollRun: { periodId } } });
    expect(payslips.length).toBe(runs.length);
    for (const payslip of payslips) {
      expect(payslip.status).toBe("PAID");
      expect(payslip.paidAt).not.toBeNull();
    }

    const closed = await post(`payroll/periods/${periodId}/close`, {}, token);
    expect(closed.status).toBe(201);
    expect(closed.body.data.status).toBe("CLOSED");
  });

  it("rejects approving a period that was never calculated", async () => {
    const created = await post(
      "payroll/periods",
      {
        code: "ITEST-2099-02",
        name: "Integration Test Periode Feb 2099",
        month: 2,
        year: 2099,
        startDate: "2099-02-01",
        endDate: "2099-02-28",
      },
      token,
    );
    expect(created.status).toBe(201);

    const res = await post(`payroll/periods/${created.body.data.id}/approve`, {}, token);
    expect(res.status).toBe(400);
  });
});
