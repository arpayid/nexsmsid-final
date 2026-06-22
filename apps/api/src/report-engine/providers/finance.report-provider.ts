import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ReportDataResult } from "../report-engine.types";
import { ReportProvider, ReportFilters, filterString, filterDate, hasFilter, formatReportDate } from "../report-provider.interface";
import { Prisma } from "@prisma/client";

@Injectable()
export class FinanceReportProvider implements ReportProvider {
  readonly reports: Record<string, (f: ReportFilters) => Promise<ReportDataResult>>;

  constructor(private prisma: PrismaService) {
    this.reports = {
      "invoice-recap": this.getInvoiceRecap.bind(this),
      "payment-recap": this.getPaymentRecap.bind(this),
      "outstanding-invoices": this.getOutstandingInvoices.bind(this),
      "expense-recap": this.getExpenseRecap.bind(this),
      "cashflow-recap": this.getCashflowRecap.bind(this),
      "ppdb-registration-recap": this.getPpdbRegistrationRecap.bind(this),
      "ppdb-status-recap": this.getPpdbStatusRecap.bind(this),
      "ppdb-conversion-recap": this.getPpdbConversionRecap.bind(this),
      "internship-recap": this.getInternshipRecap.bind(this),
      "alumni-recap": this.getAlumniRecap.bind(this),
      "industry-partner-recap": this.getIndustryPartnerRecap.bind(this),
    };
  }

  supportedReports(): string[] {
    return Object.keys(this.reports);
  }
  async getData(reportCode: string, filters: ReportFilters): Promise<ReportDataResult> {
    const fn = this.reports[reportCode];
    if (!fn) throw new Error(`Report ${reportCode} not handled by FinanceReportProvider`);
    return fn(filters);
  }

  private async getInvoiceRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      issueDate: { gte: filterDate(f, "startDate"), lte: filterDate(f, "endDate") },
    };
    if (hasFilter(f, "status")) where.status = f.status as never;
    if (filterString(f, "studentId")) where.studentId = filterString(f, "studentId");
    const invoices = await this.prisma.invoice.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { student: true },
      orderBy: { issueDate: "desc" },
    });
    return {
      title: "Invoice Recap",
      subtitle: `Period: ${String(f.startDate)} to ${String(f.endDate)}`,
      columns: [
        { key: "invoiceNumber", label: "Invoice #", width: 20 },
        { key: "date", label: "Date", width: 15 },
        { key: "student", label: "Student", width: 30 },
        { key: "total", label: "Total Amount", width: 15 },
        { key: "paid", label: "Paid Amount", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: invoices.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        date: i.issueDate.toISOString().split("T")[0],
        student: i.student.name,
        total: Number(i.total),
        paid: Number(i.paidAmount),
        status: i.status,
      })),
    };
  }

  private async getPaymentRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PaymentWhereInput = { paidAt: { gte: filterDate(f, "startDate"), lte: filterDate(f, "endDate") } };
    if (filterString(f, "studentId")) where.invoice = { studentId: filterString(f, "studentId") };
    const payments = await this.prisma.payment.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { invoice: { include: { student: true } } },
      orderBy: { paidAt: "desc" },
    });
    return {
      title: "Payment Recap",
      subtitle: `Period: ${String(f.startDate)} to ${String(f.endDate)}`,
      columns: [
        { key: "date", label: "Paid At", width: 15 },
        { key: "invoiceNum", label: "Invoice #", width: 20 },
        { key: "student", label: "Student", width: 30 },
        { key: "amount", label: "Amount", width: 15 },
        { key: "method", label: "Method", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: payments.map((p) => ({
        date: p.paidAt.toISOString().split("T")[0],
        invoiceNum: p.invoice.invoiceNumber,
        student: p.invoice.student.name,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
      })),
    };
  }

  private async getOutstandingInvoices(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InvoiceWhereInput = { deletedAt: null, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } };
    if (filterString(f, "studentId")) where.studentId = filterString(f, "studentId");
    if (filterString(f, "academicYearId")) where.academicYearId = filterString(f, "academicYearId");
    const invoices = await this.prisma.invoice.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { student: true, academicYear: true },
      orderBy: { issueDate: "asc" },
    });
    return {
      title: "Outstanding Invoices",
      columns: [
        { key: "invoiceNum", label: "Invoice #", width: 20 },
        { key: "date", label: "Issue Date", width: 15 },
        { key: "student", label: "Student", width: 30 },
        { key: "ay", label: "AY", width: 15 },
        { key: "total", label: "Total", width: 15 },
        { key: "paid", label: "Paid", width: 15 },
        { key: "remaining", label: "Remaining", width: 15 },
      ],
      rows: invoices.map((i) => ({
        invoiceNum: i.invoiceNumber,
        date: i.issueDate.toISOString().split("T")[0],
        student: i.student.name,
        ay: i.academicYear?.name || "-",
        total: Number(i.total),
        paid: Number(i.paidAmount),
        remaining: Number(i.total) - Number(i.paidAmount),
      })),
    };
  }

  private async getExpenseRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.ExpenseWhereInput = { deletedAt: null, date: { gte: filterDate(f, "startDate"), lte: filterDate(f, "endDate") } };
    if (hasFilter(f, "status")) where.status = f.status as never;
    const expenses = await this.prisma.expense.findMany({ take: Number(f.limit || 5000), where, orderBy: { date: "desc" } });
    return {
      title: "Expense Recap",
      subtitle: `Period: ${String(f.startDate)} to ${String(f.endDate)}`,
      columns: [
        { key: "num", label: "Expense #", width: 20 },
        { key: "date", label: "Date", width: 15 },
        { key: "title", label: "Title", width: 30 },
        { key: "category", label: "Category", width: 15 },
        { key: "amount", label: "Amount", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: expenses.map((e) => ({
        num: e.expenseNumber,
        date: e.date.toISOString().split("T")[0],
        title: e.title,
        category: e.category,
        amount: Number(e.amount),
        status: e.status,
      })),
    };
  }

  private async getCashflowRecap(f: ReportFilters): Promise<ReportDataResult> {
    const start = filterDate(f, "startDate");
    const end = filterDate(f, "endDate");
    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        take: Number(f.limit || 5000),
        where: { paidAt: { gte: start, lte: end }, status: "VERIFIED" },
        orderBy: { paidAt: "asc" },
      }),
      this.prisma.expense.findMany({
        take: Number(f.limit || 5000),
        where: { date: { gte: start, lte: end }, status: "PAID" },
        orderBy: { date: "asc" },
      }),
    ]);
    const rows = [
      ...payments.map((p) => ({
        date: p.paidAt.toISOString().split("T")[0],
        type: "INCOME (Payment)",
        description: `Payment ${p.paymentNumber}`,
        amount: Number(p.amount),
      })),
      ...expenses.map((e) => ({
        date: e.date.toISOString().split("T")[0],
        type: "EXPENSE",
        description: `${e.title} (${e.expenseNumber})`,
        amount: -Number(e.amount),
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    return {
      title: "Cashflow Recap",
      subtitle: `Period: ${String(f.startDate)} to ${String(f.endDate)}`,
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "type", label: "Type", width: 20 },
        { key: "description", label: "Description", width: 40 },
        { key: "amount", label: "Amount", width: 15 },
      ],
      rows,
    };
  }

  private async getPpdbRegistrationRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PpdbRegistrationWhereInput = { period: { academicYearId: filterString(f, "academicYearId") } };
    if (hasFilter(f, "status")) where.status = f.status as never;
    if (filterString(f, "departmentId")) where.selectedDepartmentId = filterString(f, "departmentId");
    const regs = await this.prisma.ppdbRegistration.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { selectedDepartment: true, selectedCompetency: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "PPDB Registration Recap",
      columns: [
        { key: "regNum", label: "Reg #", width: 15 },
        { key: "name", label: "Name", width: 30 },
        { key: "gender", label: "Gender", width: 10 },
        { key: "department", label: "Department", width: 20 },
        { key: "status", label: "Status", width: 15 },
        { key: "date", label: "Date", width: 15 },
      ],
      rows: regs.map((r) => ({
        regNum: r.registrationNumber,
        name: r.name,
        gender: r.gender,
        department: r.selectedDepartment?.name || "-",
        status: r.status,
        date: r.createdAt.toISOString().split("T")[0],
      })),
    };
  }

  private async getPpdbStatusRecap(f: ReportFilters): Promise<ReportDataResult> {
    const stats = await this.prisma.ppdbRegistration.groupBy({
      take: Number(f.limit || 5000),
      by: ["status"],
      orderBy: { status: "asc" },
      where: { period: { academicYearId: filterString(f, "academicYearId") } },
      _count: { _all: true },
    });
    return {
      title: "PPDB Status Summary",
      columns: [
        { key: "status", label: "Status", width: 25 },
        { key: "count", label: "Count", width: 15 },
      ],
      rows: stats.map((s) => ({ status: s.status, count: s._count._all })),
    };
  }

  private async getPpdbConversionRecap(f: ReportFilters): Promise<ReportDataResult> {
    const regs = await this.prisma.ppdbRegistration.findMany({
      take: Number(f.limit || 5000),
      where: { period: { academicYearId: filterString(f, "academicYearId") }, status: "CONVERTED" },
      include: { convertedStudent: { include: { classroom: true } }, selectedDepartment: true },
      orderBy: { updatedAt: "desc" },
    });
    return {
      title: "PPDB Conversion Recap",
      columns: [
        { key: "regNum", label: "Reg #", width: 15 },
        { key: "name", label: "Student Name", width: 30 },
        { key: "department", label: "Department", width: 20 },
        { key: "classroom", label: "Assigned Class", width: 15 },
        { key: "date", label: "Conversion Date", width: 20 },
      ],
      rows: regs.map((r) => ({
        regNum: r.registrationNumber,
        name: r.name,
        department: r.selectedDepartment?.name || "-",
        classroom: r.convertedStudent?.classroom?.name || "-",
        date: r.updatedAt.toISOString().split("T")[0],
      })),
    };
  }

  private async getInternshipRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.internship.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null } as any,
      include: { student: true } as any,
      orderBy: { startDate: "desc" },
    });
    return {
      title: "Internship Recap",
      columns: [
        { key: "student", label: "Student", width: 25 },
        { key: "company", label: "Company", width: 25 },
        { key: "start", label: "Start", width: 15 },
        { key: "end", label: "End", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i: any) => ({
        student: i.student?.name || "-",
        company: i.partner?.name || "-",
        start: formatReportDate(i.startDate),
        end: formatReportDate(i.endDate),
        status: i.status,
      })),
    };
  }

  private async getAlumniRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.alumni.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { student: true },
      orderBy: { graduationYear: "desc" },
    });
    return {
      title: "Alumni Recap",
      columns: [
        { key: "name", label: "Name", width: 25 },
        { key: "nis", label: "NIS", width: 15 },
        { key: "year", label: "Grad Year", width: 12 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((a) => ({ name: a.name, nis: a.student?.nis || "-", year: a.graduationYear, status: a.status })),
    };
  }

  private async getIndustryPartnerRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.IndustryPartnerWhereInput = { deletedAt: null };
    if (hasFilter(f, "status")) where.status = f.status as never;
    const partners = await this.prisma.industryPartner.findMany({ take: Number(f.limit || 5000), where, orderBy: { name: "asc" } });
    return {
      title: "Industry Partner Recap",
      columns: [
        { key: "name", label: "Partner Name", width: 30 },
        { key: "type", label: "Type", width: 15 },
        { key: "contact", label: "Contact Person", width: 20 },
        { key: "phone", label: "Phone", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: partners.map((p) => ({
        name: p.name,
        type: p.type || "-",
        contact: p.contactPerson || "-",
        phone: p.phone || "-",
        status: p.status,
      })),
    };
  }
}
