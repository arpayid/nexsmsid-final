import { Injectable, Inject } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { ReportDataResult } from "./report-engine.types";

type ReportFilters = Record<string, unknown>;

type LetterReportSource = Prisma.LetterGetPayload<{
  include: { createdBy: { select: { name: true } }; approvedBy: { select: { name: true } } };
}>;

type LibraryPopularBookStats = {
  bookCode: string;
  isbn: string;
  title: string;
  author: string;
  categoryName: string;
  totalLoans: number;
  borrowedCount: number;
  returnedCount: number;
  overdueCount: number;
  lostCount: number;
  totalCopies: number;
  availableCopies: number;
};

@Injectable()
export class ReportDataService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getData(reportCode: string, filters: ReportFilters): Promise<ReportDataResult> {
    switch (reportCode) {
      case "students-by-class":
        return this.getStudentsByClass(filters);
      case "attendance-class-recap":
        return this.getAttendanceClassRecap(filters);
      case "invoice-recap":
        return this.getInvoiceRecap(filters);
      case "ppdb-registration-recap":
        return this.getPpdbRegistrationRecap(filters);
      case "internship-recap":
        return this.getInternshipRecap(filters);
      case "alumni-recap":
        return this.getAlumniRecap(filters);
      case "payment-recap":
        return this.getPaymentRecap(filters);
      case "outstanding-invoices":
        return this.getOutstandingInvoices(filters);
      case "ppdb-status-recap":
        return this.getPpdbStatusRecap(filters);
      case "expense-recap":
        return this.getExpenseRecap(filters);
      case "grades-class-recap":
        return this.getGradesClassRecap(filters);
      case "teacher-schedule-recap":
        return this.getTeacherScheduleRecap(filters);
      case "cashflow-recap":
        return this.getCashflowRecap(filters);
      case "ppdb-conversion-recap":
        return this.getPpdbConversionRecap(filters);
      case "industry-partner-recap":
        return this.getIndustryPartnerRecap(filters);
      case "discipline-violation-recap":
        return this.getDisciplineViolationRecap(filters);
      case "student-discipline-summary":
        return this.getStudentDisciplineSummary(filters);
      case "counseling-case-recap":
        return this.getCounselingCaseRecap(filters);
      case "letter-recap":
        return this.getLetterRecap(filters);
      case "outgoing-letter-recap":
        return this.getLetterRecap({ ...filters, direction: "OUTGOING" });
      case "incoming-letter-recap":
        return this.getLetterRecap({ ...filters, direction: "INCOMING" });
      case "letter-approval-recap":
        return this.getLetterApprovalRecap(filters);
      case "inventory-item-recap":
        return this.getInventoryItemRecap(filters);
      case "inventory-movement-recap":
        return this.getInventoryMovementRecap(filters);
      case "inventory-maintenance-recap":
        return this.getInventoryMaintenanceRecap(filters);

      // HR & Payroll
      case "hr-employee-recap":
        return this.getHrEmployeeRecap(filters);
      case "hr-attendance-recap":
        return this.getHrAttendanceRecap(filters);
      case "hr-leave-recap":
        return this.getHrLeaveRecap(filters);
      case "payroll-period-recap":
        return this.getPayrollPeriodRecap(filters);
      case "payroll-run-recap":
        return this.getPayrollRunRecap(filters);
      case "payroll-component-recap":
        return this.getPayrollComponentRecap(filters);
      case "payroll-payment-recap":
        return this.getPayrollPaymentRecap(filters);
      case "inventory-loan-recap":
        return this.getInventoryLoanRecap(filters);
      case "inventory-low-stock-recap":
        return this.getInventoryLowStockRecap(filters);
      case "library-book-recap":
        return this.getLibraryBookRecap(filters);
      case "library-copy-recap":
        return this.getLibraryCopyRecap(filters);
      case "library-loan-recap":
        return this.getLibraryLoanRecap(filters);
      case "library-overdue-loan-recap":
        return this.getLibraryOverdueLoanRecap(filters);
      case "library-fine-recap":
        return this.getLibraryFineRecap(filters);
      case "library-member-recap":
        return this.getLibraryMemberRecap(filters);
      case "library-popular-book-recap":
        return this.getLibraryPopularBookRecap(filters);
      case "job-application-recap":
        return this.getJobApplicationRecap(filters);
      case "tracer-study-recap":
        return this.getTracerStudyRecap(filters);
      case "announcement-recap":
        return this.getAnnouncementRecap(filters);
      case "notification-recap":
        return this.getNotificationRecap(filters);
      case "exam-recap":
        return this.getExamRecap(filters);
      case "exam-participant-list":
        return this.getExamParticipantList(filters);
      case "exam-results":
        return this.getExamResultsRecap(filters);
      default:
        return this.getPlaceholderData(reportCode);
    }
  }

  private async getGradesClassRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.GradeWhereInput = {
      assessment: {
        teachingAssignment: {
          academicYearId: filterString(filters, "academicYearId"),
          semesterId: filterString(filters, "semesterId"),
          classroomId: filterString(filters, "classroomId"),
        },
      },
    };
    const subjectId = filterString(filters, "subjectId");
    if (subjectId) {
      where.assessment = {
        teachingAssignment: {
          academicYearId: filterString(filters, "academicYearId"),
          semesterId: filterString(filters, "semesterId"),
          classroomId: filterString(filters, "classroomId"),
          subjectId,
        },
      };
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: true,
        assessment: {
          include: {
            teachingAssignment: {
              include: { subject: true, classroom: true },
            },
          },
        },
      },
      orderBy: [{ student: { name: "asc" } }, { assessment: { createdAt: "asc" } }],
    });

    return {
      title: "Grades Class Recap",
      columns: [
        { key: "student", label: "Student", width: 30 },
        { key: "subject", label: "Subject", width: 20 },
        { key: "assessment", label: "Assessment", width: 25 },
        { key: "score", label: "Score", width: 10 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: grades.map((g) => ({
        student: g.student.name,
        subject: g.assessment.teachingAssignment.subject.name,
        assessment: g.assessment.name,
        score: g.score,
        status: g.status,
      })),
    };
  }

  private async getTeacherScheduleRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.ScheduleWhereInput = {
      teachingAssignment: {
        academicYearId: filterString(filters, "academicYearId"),
        semesterId: filterString(filters, "semesterId"),
      },
    };
    const teacherId = filterString(filters, "teacherId");
    if (teacherId) {
      where.teachingAssignment = {
        academicYearId: filterString(filters, "academicYearId"),
        semesterId: filterString(filters, "semesterId"),
        teacherId,
      };
    }

    const schedules = await this.prisma.schedule.findMany({
      where,
      include: {
        teachingAssignment: {
          include: { teacher: true, subject: true, classroom: true },
        },
        lessonHour: true,
        room: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { lessonHour: { startTime: "asc" } }],
    });

    return {
      title: "Teacher Schedule Recap",
      columns: [
        { key: "day", label: "Day", width: 15 },
        { key: "time", label: "Time", width: 15 },
        { key: "teacher", label: "Teacher", width: 30 },
        { key: "subject", label: "Subject", width: 20 },
        { key: "classroom", label: "Class", width: 15 },
        { key: "room", label: "Room", width: 15 },
      ],
      rows: schedules.map((s) => ({
        day: s.dayOfWeek,
        time: `${s.lessonHour.startTime} - ${s.lessonHour.endTime}`,
        teacher: s.teachingAssignment.teacher.name,
        subject: s.teachingAssignment.subject.name,
        classroom: s.teachingAssignment.classroom.name,
        room: s.room?.name || "-",
      })),
    };
  }

  private async getCashflowRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const startDate = filterDate(filters, "startDate");
    const endDate = filterDate(filters, "endDate");

    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paidAt: { gte: startDate, lte: endDate }, status: "VERIFIED" },
        orderBy: { paidAt: "asc" },
      }),
      this.prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate }, status: "PAID" },
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
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "type", label: "Type", width: 20 },
        { key: "description", label: "Description", width: 40 },
        { key: "amount", label: "Amount", width: 15 },
      ],
      rows,
    };
  }

  private async getPpdbConversionRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PpdbRegistrationWhereInput = {
      period: { academicYearId: filterString(filters, "academicYearId") },
      status: "CONVERTED",
    };

    const regs = await this.prisma.ppdbRegistration.findMany({
      where,
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

  private async getIndustryPartnerRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.IndustryPartnerWhereInput = { deletedAt: null };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const partners = await this.prisma.industryPartner.findMany({
      where,
      orderBy: { name: "asc" },
    });

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

  private async getStudentsByClass(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.StudentWhereInput = { deletedAt: null };
    const classroomId = filterString(filters, "classroomId");
    if (classroomId) where.classroomId = classroomId;
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const students = await this.prisma.student.findMany({
      where,
      include: { classroom: true },
      orderBy: [{ classroom: { name: "asc" } }, { name: "asc" }],
    });

    return {
      title: "Students by Class Report",
      columns: [
        { key: "nis", label: "NIS", width: 15 },
        { key: "name", label: "Student Name", width: 30 },
        { key: "gender", label: "Gender", width: 10 },
        { key: "classroom", label: "Class", width: 20 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: students.map((s) => ({
        nis: s.nis,
        name: s.name,
        gender: s.gender,
        classroom: s.classroom?.name || "-",
        status: s.status,
      })),
    };
  }

  private async getAttendanceClassRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.AttendanceSessionWhereInput = {
      date: {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      },
    };
    if (filterString(filters, "classroomId")) {
      where.schedule = { teachingAssignment: { classroomId: filterString(filters, "classroomId") } };
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: {
        records: { include: { student: true } },
        schedule: {
          include: {
            teachingAssignment: {
              include: { classroom: true, subject: true },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    const rows = [];
    for (const session of sessions) {
      for (const record of session.records) {
        rows.push({
          date: session.date.toISOString().split("T")[0],
          student: record.student.name,
          class: session.schedule.teachingAssignment.classroom.name,
          subject: session.schedule.teachingAssignment.subject.name,
          status: record.status,
          note: record.note || "-",
        });
      }
    }

    return {
      title: "Attendance Class Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "student", label: "Student", width: 30 },
        { key: "class", label: "Class", width: 15 },
        { key: "subject", label: "Subject", width: 20 },
        { key: "status", label: "Status", width: 10 },
        { key: "note", label: "Note", width: 20 },
      ],
      rows,
    };
  }

  private async getInvoiceRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      issueDate: {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      },
    };
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (filterString(filters, "studentId")) where.studentId = filterString(filters, "studentId");

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { student: true },
      orderBy: { issueDate: "desc" },
    });

    return {
      title: "Invoice Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
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

  private async getPaymentRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PaymentWhereInput = {
      paidAt: {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      },
    };
    if (filterString(filters, "studentId")) where.invoice = { studentId: filterString(filters, "studentId") };

    const payments = await this.prisma.payment.findMany({
      where,
      include: { invoice: { include: { student: true } } },
      orderBy: { paidAt: "desc" },
    });

    return {
      title: "Payment Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
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

  private async getOutstandingInvoices(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] },
    };
    if (filterString(filters, "studentId")) where.studentId = filterString(filters, "studentId");
    if (filterString(filters, "academicYearId")) where.academicYearId = filterString(filters, "academicYearId");

    const invoices = await this.prisma.invoice.findMany({
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

  private async getPpdbRegistrationRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PpdbRegistrationWhereInput = { period: { academicYearId: filterString(filters, "academicYearId") } };
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (filterString(filters, "departmentId")) where.selectedDepartmentId = filterString(filters, "departmentId");

    const regs = await this.prisma.ppdbRegistration.findMany({
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

  private async getPpdbStatusRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PpdbRegistrationWhereInput = { period: { academicYearId: filterString(filters, "academicYearId") } };

    const stats = await this.prisma.ppdbRegistration.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    return {
      title: "PPDB Status Summary",
      columns: [
        { key: "status", label: "Status", width: 25 },
        { key: "count", label: "Count", width: 15 },
      ],
      rows: stats.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
    };
  }

  private async getExpenseRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
      date: {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      },
    };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const expenses = await this.prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return {
      title: "Expense Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
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

  private async getInternshipRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InternshipWhereInput = {
      deletedAt: null,
      startDate: { gte: filterDate(filters, "startDate") },
      endDate: { lte: filterDate(filters, "endDate") },
    };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const internships = await this.prisma.internship.findMany({
      where,
      include: { student: true, industryPartner: true },
    });

    return {
      title: "Internship Recap",
      columns: [
        { key: "student", label: "Student", width: 30 },
        { key: "partner", label: "Partner", width: 30 },
        { key: "title", label: "Internship Title", width: 25 },
        { key: "period", label: "Period", width: 25 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: internships.map((i) => ({
        student: i.student.name,
        partner: i.industryPartner.name,
        title: i.title,
        period: `${i.startDate.toISOString().split("T")[0]} - ${i.endDate.toISOString().split("T")[0]}`,
        status: i.status,
      })),
    };
  }

  private async getAlumniRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.AlumniWhereInput = { deletedAt: null };
    const graduationYear = filterNumber(filters, "graduationYear");
    if (graduationYear !== undefined) where.graduationYear = graduationYear;
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const alumni = await this.prisma.alumni.findMany({
      where,
      orderBy: { graduationYear: "desc" },
    });

    return {
      title: "Alumni Recap",
      columns: [
        { key: "name", label: "Name", width: 30 },
        { key: "year", label: "Graduation Year", width: 15 },
        { key: "status", label: "Status", width: 15 },
        { key: "company", label: "Current Company", width: 25 },
        { key: "position", label: "Position", width: 20 },
      ],
      rows: alumni.map((a) => ({
        name: a.name,
        year: a.graduationYear,
        status: a.status,
        company: a.currentCompany || "-",
        position: a.currentPosition || "-",
      })),
    };
  }

  private async getDisciplineViolationRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.DisciplineViolationWhereInput = { deletedAt: null };
    if (filterString(filters, "studentId")) where.studentId = filterString(filters, "studentId");
    if (filterString(filters, "classroomId")) where.student = { classroomId: filterString(filters, "classroomId") };
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (hasFilter(filters, "severity")) where.rule = { severity: filterString(filters, "severity") as never };
    if (hasFilter(filters, "startDate") || hasFilter(filters, "endDate")) {
      where.incidentDate = {
        ...(hasFilter(filters, "startDate") ? { gte: filterDate(filters, "startDate") } : {}),
        ...(hasFilter(filters, "endDate") ? { lte: filterDate(filters, "endDate") } : {}),
      };
    }

    const violations = await this.prisma.disciplineViolation.findMany({
      where,
      include: {
        rule: true,
        student: { include: { classroom: true } },
        reportedBy: { select: { name: true } },
        confirmedBy: { select: { name: true } },
      },
      orderBy: { incidentDate: "desc" },
    });

    return {
      title: "Discipline Violation Recap",
      columns: [
        { key: "date", label: "Incident Date", width: 15 },
        { key: "student", label: "Student", width: 30 },
        { key: "classroom", label: "Class", width: 15 },
        { key: "rule", label: "Rule", width: 30 },
        { key: "severity", label: "Severity", width: 15 },
        { key: "point", label: "Point", width: 10 },
        { key: "status", label: "Status", width: 15 },
        { key: "reportedBy", label: "Reported By", width: 25 },
      ],
      rows: violations.map((item) => ({
        date: item.incidentDate.toISOString().split("T")[0],
        student: item.student.name,
        classroom: item.student.classroom?.name || "-",
        rule: `${item.rule.code} - ${item.rule.name}`,
        severity: item.rule.severity,
        point: item.point,
        status: item.status,
        reportedBy: item.reportedBy.name,
      })),
    };
  }

  private async getStudentDisciplineSummary(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.StudentWhereInput = { deletedAt: null };
    if (filterString(filters, "studentId")) where.id = filterString(filters, "studentId");
    const classroomId = filterString(filters, "classroomId");
    if (classroomId) where.classroomId = classroomId;
    const students = await this.prisma.student.findMany({
      where,
      include: { classroom: true },
      orderBy: [{ classroom: { name: "asc" } }, { name: "asc" }],
    });
    const studentIds = students.map((student) => student.id);
    const [violations, achievements] = await Promise.all([
      studentIds.length
        ? this.prisma.disciplineViolation.groupBy({
            by: ["studentId"],
            where: { studentId: { in: studentIds }, status: "CONFIRMED", deletedAt: null },
            _sum: { point: true },
            _count: true,
          })
        : Promise.resolve([]),
      studentIds.length
        ? this.prisma.studentAchievement.groupBy({
            by: ["studentId"],
            where: { studentId: { in: studentIds }, deletedAt: null },
            _sum: { point: true },
            _count: true,
          })
        : Promise.resolve([]),
    ]);
    const violationMap = new Map(violations.map((row) => [row.studentId, { point: row._sum.point ?? 0, count: row._count }]));
    const achievementMap = new Map(achievements.map((row) => [row.studentId, { point: row._sum.point ?? 0, count: row._count }]));

    return {
      title: "Student Discipline Summary",
      columns: [
        { key: "nis", label: "NIS", width: 15 },
        { key: "student", label: "Student", width: 30 },
        { key: "classroom", label: "Class", width: 15 },
        { key: "violationPoint", label: "Violation Point", width: 18 },
        { key: "achievementPoint", label: "Achievement Point", width: 18 },
        { key: "netPoint", label: "Net Point", width: 15 },
        { key: "violationCount", label: "Violation Count", width: 15 },
        { key: "achievementCount", label: "Achievement Count", width: 15 },
      ],
      rows: students.map((student) => {
        const violation = violationMap.get(student.id) ?? { point: 0, count: 0 };
        const achievement = achievementMap.get(student.id) ?? { point: 0, count: 0 };
        return {
          nis: student.nis,
          student: student.name,
          classroom: student.classroom?.name || "-",
          violationPoint: violation.point,
          achievementPoint: achievement.point,
          netPoint: achievement.point - violation.point,
          violationCount: violation.count,
          achievementCount: achievement.count,
        };
      }),
    };
  }

  private async getCounselingCaseRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.CounselingCaseWhereInput = { deletedAt: null };
    if (filterString(filters, "studentId")) where.studentId = filterString(filters, "studentId");
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (hasFilter(filters, "priority")) where.priority = filters.priority as never;
    if (hasFilter(filters, "category")) where.category = filters.category as never;
    if (filterString(filters, "counselorId")) where.counselorId = filterString(filters, "counselorId");
    if (hasFilter(filters, "startDate") || hasFilter(filters, "endDate")) {
      where.openedAt = {
        ...(hasFilter(filters, "startDate") ? { gte: filterDate(filters, "startDate") } : {}),
        ...(hasFilter(filters, "endDate") ? { lte: filterDate(filters, "endDate") } : {}),
      };
    }
    const cases = await this.prisma.counselingCase.findMany({
      where,
      include: { student: { include: { classroom: true } }, counselor: { select: { name: true } }, createdBy: { select: { name: true } } },
      orderBy: { openedAt: "desc" },
    });

    return {
      title: "Counseling Case Recap",
      columns: [
        { key: "openedAt", label: "Opened At", width: 15 },
        { key: "student", label: "Student", width: 30 },
        { key: "classroom", label: "Class", width: 15 },
        { key: "title", label: "Title", width: 35 },
        { key: "category", label: "Category", width: 20 },
        { key: "priority", label: "Priority", width: 15 },
        { key: "status", label: "Status", width: 15 },
        { key: "counselor", label: "Counselor", width: 25 },
        { key: "followUpDate", label: "Follow Up", width: 15 },
      ],
      rows: cases.map((item) => ({
        openedAt: item.openedAt.toISOString().split("T")[0],
        student: item.student.name,
        classroom: item.student.classroom?.name || "-",
        title: item.title,
        category: item.category,
        priority: item.priority,
        status: item.status,
        counselor: item.counselor?.name || "-",
        followUpDate: item.followUpDate ? item.followUpDate.toISOString().split("T")[0] : "-",
      })),
    };
  }

  private async getLetterRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LetterWhereInput = { deletedAt: null };
    if (hasFilter(filters, "direction")) where.direction = filters.direction as never;
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (hasFilter(filters, "category")) {
      where.category = String(filters.category)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "");
    }
    if (hasFilter(filters, "recipientType")) where.recipientType = filters.recipientType as never;
    if (hasFilter(filters, "startDate") || hasFilter(filters, "endDate")) {
      where.createdAt = {
        ...(hasFilter(filters, "startDate") ? { gte: filterDate(filters, "startDate") } : {}),
        ...(hasFilter(filters, "endDate") ? { lte: filterDate(filters, "endDate") } : {}),
      };
    }

    const letters = await this.prisma.letter.findMany({
      where,
      include: { createdBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      title:
        filterString(filters, "direction") === "OUTGOING"
          ? "Outgoing Letter Recap"
          : filterString(filters, "direction") === "INCOMING"
            ? "Incoming Letter Recap"
            : "Letter Recap",
      columns: letterReportColumns(),
      rows: letters.map((letter) => letterReportRow(letter)),
    };
  }

  private async getLetterApprovalRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LetterApprovalWhereInput = { letter: { deletedAt: null } };
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (hasFilter(filters, "category")) {
      const category = String(filters.category)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "");
      where.letter = { deletedAt: null, category: category as never };
    }
    if (hasFilter(filters, "startDate") || hasFilter(filters, "endDate")) {
      where.createdAt = {
        ...(hasFilter(filters, "startDate") ? { gte: filterDate(filters, "startDate") } : {}),
        ...(hasFilter(filters, "endDate") ? { lte: filterDate(filters, "endDate") } : {}),
      };
    }
    const approvals = await this.prisma.letterApproval.findMany({
      where,
      include: {
        approver: { select: { name: true } },
        letter: { include: { createdBy: { select: { name: true } }, approvedBy: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      title: "Letter Approval Recap",
      columns: [
        ...letterReportColumns(),
        { key: "approver", label: "Approver", width: 25 },
        { key: "approvalStatus", label: "Approval Status", width: 18 },
        { key: "approvalNote", label: "Approval Note", width: 35 },
      ],
      rows: approvals.map((approval) => ({
        ...letterReportRow(approval.letter),
        approver: approval.approver.name,
        approvalStatus: approval.status,
        approvalNote: approval.note || "-",
      })),
    };
  }

  private async getJobApplicationRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.JobApplicationWhereInput = {
      createdAt: {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      },
    };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const applications = await this.prisma.jobApplication.findMany({
      where,
      include: { jobVacancy: true, alumni: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      title: "Job Application Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "date", label: "Applied At", width: 18 },
        { key: "applicant", label: "Applicant", width: 25 },
        { key: "email", label: "Email", width: 25 },
        { key: "job", label: "Job Title", width: 25 },
        { key: "company", label: "Company", width: 20 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: applications.map((item) => ({
        date: item.createdAt.toISOString().split("T")[0],
        applicant: item.applicantName,
        email: item.applicantEmail || "-",
        job: item.jobVacancy.title,
        company: item.jobVacancy.companyName,
        status: item.status,
      })),
    };
  }

  private async getTracerStudyRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const studies = await this.prisma.tracerStudy.findMany({
      where: { year: filterNumber(filters, "year")! },
      include: { alumni: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      title: "Tracer Study Recap",
      subtitle: `Year: ${filterNumber(filters, "year")!}`,
      columns: [
        { key: "alumni", label: "Alumni", width: 25 },
        { key: "year", label: "Year", width: 10 },
        { key: "status", label: "Status", width: 15 },
        { key: "company", label: "Company", width: 20 },
        { key: "position", label: "Position", width: 20 },
        { key: "university", label: "University", width: 20 },
        { key: "income", label: "Income Range", width: 15 },
      ],
      rows: studies.map((item) => ({
        alumni: item.alumni.name,
        year: item.year,
        status: item.status,
        company: item.companyName || item.businessName || "-",
        position: item.position || "-",
        university: item.university || "-",
        income: item.incomeRange || "-",
      })),
    };
  }

  private async getAnnouncementRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.AnnouncementWhereInput = {
      deletedAt: null,
      createdAt: {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      },
    };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const announcements = await this.prisma.announcement.findMany({
      where,
      include: { createdBy: { select: { name: true } }, _count: { select: { recipients: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      title: "Announcement Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "title", label: "Title", width: 30 },
        { key: "audience", label: "Audience", width: 15 },
        { key: "status", label: "Status", width: 15 },
        { key: "publishedAt", label: "Published At", width: 18 },
        { key: "author", label: "Author", width: 20 },
        { key: "recipients", label: "Recipients", width: 12 },
      ],
      rows: announcements.map((item) => ({
        title: item.title,
        audience: item.audience,
        status: item.status,
        publishedAt: item.publishedAt ? item.publishedAt.toISOString().split("T")[0] : "-",
        author: item.createdBy?.name || "-",
        recipients: item._count.recipients,
      })),
    };
  }

  private async getNotificationRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.NotificationWhereInput = {
      createdAt: {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      },
    };
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (hasFilter(filters, "channel")) where.channel = filters.channel as never;

    const notifications = await this.prisma.notification.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      title: "Notification Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "date", label: "Created At", width: 18 },
        { key: "user", label: "User", width: 25 },
        { key: "title", label: "Title", width: 25 },
        { key: "channel", label: "Channel", width: 12 },
        { key: "status", label: "Status", width: 12 },
      ],
      rows: notifications.map((item) => ({
        date: item.createdAt.toISOString().split("T")[0],
        user: item.user.name,
        title: item.title,
        channel: item.channel,
        status: item.status,
      })),
    };
  }

  private async getExamRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.ExamWhereInput = { deletedAt: null };
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (filterString(filters, "examTypeId")) where.examTypeId = filterString(filters, "examTypeId");
    if (filterString(filters, "academicYearId")) where.academicYearId = filterString(filters, "academicYearId");

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        examType: true,
        academicYear: true,
        _count: { select: { participants: true, questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      title: "Exam Recap",
      columns: [
        { key: "code", label: "Code", width: 15 },
        { key: "name", label: "Name", width: 25 },
        { key: "type", label: "Type", width: 18 },
        { key: "year", label: "Academic Year", width: 18 },
        { key: "status", label: "Status", width: 12 },
        { key: "participants", label: "Participants", width: 12 },
        { key: "questions", label: "Questions", width: 12 },
        { key: "cbt", label: "CBT", width: 8 },
      ],
      rows: exams.map((item) => ({
        code: item.code,
        name: item.name,
        type: item.examType.name,
        year: item.academicYear.name,
        status: item.status,
        participants: item._count.participants,
        questions: item._count.questions,
        cbt: item.isCbt ? "Yes" : "No",
      })),
    };
  }

  private async getExamParticipantList(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.ExamParticipantWhereInput = { examId: filterString(filters, "examId"), deletedAt: null };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const participants = await this.prisma.examParticipant.findMany({
      where,
      include: {
        student: true,
        session: { include: { schedule: { include: { room: true } } } },
      },
      orderBy: [{ number: "asc" }, { createdAt: "asc" }],
    });

    return {
      title: "Exam Participant List",
      columns: [
        { key: "number", label: "No", width: 8 },
        { key: "name", label: "Student", width: 30 },
        { key: "nis", label: "NIS", width: 15 },
        { key: "status", label: "Status", width: 15 },
        { key: "score", label: "Score", width: 10 },
        { key: "session", label: "Session", width: 15 },
        { key: "room", label: "Room", width: 15 },
      ],
      rows: participants.map((item) => ({
        number: item.number ?? "-",
        name: item.student.name,
        nis: item.student.nis,
        status: item.status,
        score: item.score ?? "-",
        session: item.session?.id ? item.session.id.slice(-6) : "-",
        room: item.session?.schedule?.room?.name || "-",
      })),
    };
  }

  private async getExamResultsRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const participants = await this.prisma.examParticipant.findMany({
      where: { examId: filterString(filters, "examId"), deletedAt: null },
      include: {
        student: true,
        results: true,
      },
      orderBy: [{ number: "asc" }, { createdAt: "asc" }],
    });

    return {
      title: "Exam Results",
      columns: [
        { key: "number", label: "No", width: 8 },
        { key: "name", label: "Student", width: 30 },
        { key: "status", label: "Status", width: 15 },
        { key: "answered", label: "Answered", width: 12 },
        { key: "correct", label: "Correct", width: 12 },
        { key: "score", label: "Total Score", width: 12 },
      ],
      rows: participants.map((item) => {
        const answered = item.results.length;
        const correct = item.results.filter((result) => result.isCorrect).length;
        const computedScore = item.results.reduce((sum, result) => sum + (result.score ?? 0), 0);

        return {
          number: item.number ?? "-",
          name: item.student.name,
          status: item.status,
          answered,
          correct,
          score: item.score ?? computedScore,
        };
      }),
    };
  }

  private async getPlaceholderData(reportCode: string): Promise<ReportDataResult> {
    return {
      title: `Report: ${reportCode}`,
      columns: [{ key: "info", label: "Information", width: 50 }],
      rows: [{ info: `Data for ${reportCode} is coming soon.` }],
    };
  }

  private async getInventoryItemRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InventoryItemWhereInput = { deletedAt: null };
    if (filterString(filters, "categoryId")) where.categoryId = filterString(filters, "categoryId");
    if (filterString(filters, "locationId")) where.locationId = filterString(filters, "locationId");
    if (hasFilter(filters, "type")) where.type = filters.type as never;
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (hasFilter(filters, "condition")) where.condition = filters.condition as never;

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: { category: true, location: true },
      orderBy: { code: "asc" },
    });

    return {
      title: "Inventory Item Recap",
      columns: [
        { key: "code", label: "Item Code", width: 15 },
        { key: "name", label: "Name", width: 30 },
        { key: "category", label: "Category", width: 20 },
        { key: "location", label: "Location", width: 20 },
        { key: "type", label: "Type", width: 15 },
        { key: "quantity", label: "Qty", width: 10 },
        { key: "condition", label: "Condition", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i) => ({
        code: i.code,
        name: i.name,
        category: i.category?.name ?? "-",
        location: i.location?.name ?? "-",
        type: i.type,
        quantity: i.quantity,
        condition: i.condition,
        status: i.status,
      })),
    };
  }

  private async getInventoryMovementRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InventoryMovementWhereInput = {};
    if (hasFilter(filters, "startDate") && hasFilter(filters, "endDate")) {
      where.performedAt = {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      };
    }
    if (filterString(filters, "fromLocationId")) where.fromLocationId = filterString(filters, "fromLocationId");
    if (filterString(filters, "toLocationId")) where.toLocationId = filterString(filters, "toLocationId");

    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      include: { item: true, fromLocation: true, toLocation: true, performedBy: true },
      orderBy: { performedAt: "desc" },
    });

    return {
      title: "Inventory Movement Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "item", label: "Item", width: 30 },
        { key: "type", label: "Movement Type", width: 15 },
        { key: "qty", label: "Qty", width: 10 },
        { key: "from", label: "From Location", width: 20 },
        { key: "to", label: "To Location", width: 20 },
        { key: "user", label: "Performed By", width: 20 },
      ],
      rows: movements.map((m) => ({
        date: m.performedAt.toISOString().split("T")[0],
        item: m.item.name,
        type: m.type,
        qty: m.quantity,
        from: m.fromLocation?.name ?? "-",
        to: m.toLocation?.name ?? "-",
        user: m.performedBy?.name ?? "-",
      })),
    };
  }

  private async getInventoryMaintenanceRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InventoryMaintenanceWhereInput = { deletedAt: null };
    if (hasFilter(filters, "startDate") && hasFilter(filters, "endDate")) {
      where.scheduledAt = {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      };
    }
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const maintenances = await this.prisma.inventoryMaintenance.findMany({
      where,
      include: { item: true, handledBy: true },
      orderBy: { scheduledAt: "desc" },
    });

    return {
      title: "Inventory Maintenance Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "scheduled", label: "Scheduled At", width: 15 },
        { key: "item", label: "Item", width: 30 },
        { key: "title", label: "Activity", width: 30 },
        { key: "status", label: "Status", width: 15 },
        { key: "handledBy", label: "Handled By", width: 20 },
        { key: "cost", label: "Cost", width: 15 },
      ],
      rows: maintenances.map((m) => ({
        scheduled: m.scheduledAt ? m.scheduledAt.toISOString().split("T")[0] : "-",
        item: m.item.name,
        title: m.title,
        status: m.status,
        handledBy: m.handledBy?.name ?? "-",
        cost: m.cost ?? "-",
      })),
    };
  }

  private async getInventoryLoanRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InventoryLoanWhereInput = { deletedAt: null };
    if (hasFilter(filters, "startDate") && hasFilter(filters, "endDate")) {
      where.requestedAt = {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      };
    }
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (hasFilter(filters, "borrowerType")) where.borrowerType = filters.borrowerType as never;

    const loans = await this.prisma.inventoryLoan.findMany({
      where,
      include: { item: true },
      orderBy: { requestedAt: "desc" },
    });

    return {
      title: "Inventory Loan Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "date", label: "Request Date", width: 15 },
        { key: "item", label: "Item", width: 30 },
        { key: "borrower", label: "Borrower", width: 25 },
        { key: "qty", label: "Qty", width: 10 },
        { key: "status", label: "Status", width: 15 },
        { key: "dueAt", label: "Due Date", width: 15 },
      ],
      rows: loans.map((l) => ({
        date: l.requestedAt.toISOString().split("T")[0],
        item: l.item.name,
        borrower: l.borrowerName,
        qty: l.quantity,
        status: l.status,
        dueAt: l.dueAt ? l.dueAt.toISOString().split("T")[0] : "-",
      })),
    };
  }

  private async getInventoryLowStockRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InventoryItemWhereInput = { deletedAt: null };
    if (filterString(filters, "categoryId")) where.categoryId = filterString(filters, "categoryId");
    if (filterString(filters, "locationId")) where.locationId = filterString(filters, "locationId");

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: { category: true, location: true },
      orderBy: { code: "asc" },
    });

    const lowStock = items.filter((i) => i.minStock !== null && i.quantity <= i.minStock);

    return {
      title: "Inventory Low Stock Recap",
      columns: [
        { key: "code", label: "Item Code", width: 15 },
        { key: "name", label: "Name", width: 30 },
        { key: "category", label: "Category", width: 20 },
        { key: "location", label: "Location", width: 20 },
        { key: "qty", label: "Current Qty", width: 15 },
        { key: "min", label: "Min Stock", width: 15 },
      ],
      rows: lowStock.map((i) => ({
        code: i.code,
        name: i.name,
        category: i.category?.name ?? "-",
        location: i.location?.name ?? "-",
        qty: i.quantity,
        min: i.minStock,
      })),
    };
  }

  private async getLibraryBookRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LibraryBookWhereInput = { deletedAt: null };
    if (filterString(filters, "categoryId")) where.categoryId = filterString(filters, "categoryId");

    const items = await this.prisma.libraryBook.findMany({
      where,
      include: { category: true },
      orderBy: { title: "asc" },
    });

    const data = items.map((i) => ({
      code: i.code,
      title: i.title,
      author: i.author,
      publisher: i.publisher,
      category: i.category?.name || "-",
      publicationYear: i.publicationYear || "-",
      status: i.status,
    }));

    return {
      title: "Library Book Recap",
      columns: [
        { key: "code", label: "Code", width: 15 },
        { key: "title", label: "Title", width: 35 },
        { key: "author", label: "Author", width: 20 },
        { key: "publisher", label: "Publisher", width: 20 },
        { key: "category", label: "Category", width: 15 },
        { key: "publicationYear", label: "Year", width: 10 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: data,
    };
  }

  private async getLibraryCopyRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LibraryBookCopyWhereInput = { deletedAt: null, book: { deletedAt: null } };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const items = await this.prisma.libraryBookCopy.findMany({
      where,
      include: { book: true },
      orderBy: { copyCode: "asc" },
    });

    const data = items.map((i) => ({
      copyCode: i.copyCode,
      bookTitle: i.book?.title || "-",
      barcode: i.barcode || "-",
      condition: i.condition || "-",
      status: i.status,
    }));

    return {
      title: "Library Book Copy Recap",
      columns: [
        { key: "copyCode", label: "Copy Code", width: 20 },
        { key: "bookTitle", label: "Book Title", width: 40 },
        { key: "barcode", label: "Barcode", width: 20 },
        { key: "condition", label: "Condition", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: data,
    };
  }

  private async getLibraryLoanRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LibraryLoanWhereInput = { deletedAt: null };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const items = await this.prisma.libraryLoan.findMany({
      where,
      include: { member: true, copy: { include: { book: true } } },
      orderBy: { borrowedAt: "desc" },
    });

    const data = items.map((i) => ({
      memberCode: i.member?.memberCode || "-",
      bookTitle: i.copy?.book?.title || "-",
      copyCode: i.copy?.copyCode || "-",
      borrowedAt: i.borrowedAt ? i.borrowedAt.toISOString().split("T")[0] : "-",
      dueAt: i.dueAt ? i.dueAt.toISOString().split("T")[0] : "-",
      status: i.status,
    }));

    return {
      title: "Library Loan Recap",
      columns: [
        { key: "memberCode", label: "Member", width: 15 },
        { key: "bookTitle", label: "Book Title", width: 35 },
        { key: "copyCode", label: "Copy Code", width: 15 },
        { key: "borrowedAt", label: "Borrowed At", width: 15 },
        { key: "dueAt", label: "Due At", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: data,
    };
  }

  private async getLibraryOverdueLoanRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LibraryLoanWhereInput = { deletedAt: null, status: "BORROWED", dueAt: { lt: new Date() } };

    const items = await this.prisma.libraryLoan.findMany({
      where,
      include: { member: true, copy: { include: { book: true } } },
      orderBy: { dueAt: "asc" },
    });

    const data = items.map((i) => ({
      memberCode: i.member?.memberCode || "-",
      bookTitle: i.copy?.book?.title || "-",
      dueAt: i.dueAt ? i.dueAt.toISOString().split("T")[0] : "-",
    }));

    return {
      title: "Library Overdue Loan Recap",
      columns: [
        { key: "memberCode", label: "Member", width: 20 },
        { key: "bookTitle", label: "Book Title", width: 50 },
        { key: "dueAt", label: "Due At", width: 20 },
      ],
      rows: data,
    };
  }

  private async getLibraryFineRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LibraryFineWhereInput = { deletedAt: null };
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const items = await this.prisma.libraryFine.findMany({
      where,
      include: { member: true, loan: { include: { copy: { include: { book: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const data = items.map((i) => ({
      memberCode: i.member?.memberCode || "-",
      bookTitle: i.loan?.copy?.book?.title || "-",
      amount: i.amount ? i.amount.toNumber() : 0,
      status: i.status,
    }));

    return {
      title: "Library Fine Recap",
      columns: [
        { key: "memberCode", label: "Member", width: 20 },
        { key: "bookTitle", label: "Book Title", width: 40 },
        { key: "amount", label: "Amount", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: data,
    };
  }

  private async getLibraryMemberRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LibraryMemberWhereInput = { deletedAt: null };
    if (hasFilter(filters, "type")) where.type = filters.type as never;
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const items = await this.prisma.libraryMember.findMany({
      where,
      include: { user: true, student: true, teacher: true, staff: true },
      orderBy: { memberCode: "asc" },
    });

    const data = items.map((i) => ({
      memberCode: i.memberCode,
      name: i.student?.name || i.teacher?.name || i.staff?.name || i.user?.name || i.externalName || "-",
      type: i.type,
      status: i.status,
      joinedAt: i.joinedAt ? i.joinedAt.toISOString().split("T")[0] : "-",
    }));

    return {
      title: "Library Member Recap",
      columns: [
        { key: "memberCode", label: "Member Code", width: 20 },
        { key: "name", label: "Name", width: 40 },
        { key: "type", label: "Type", width: 15 },
        { key: "status", label: "Status", width: 15 },
        { key: "joinedAt", label: "Joined", width: 15 },
      ],
      rows: data,
    };
  }

  private async getLibraryPopularBookRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const loanWhere: Prisma.LibraryLoanWhereInput = { deletedAt: null };
    if (hasFilter(filters, "startDate") && hasFilter(filters, "endDate")) {
      loanWhere.borrowedAt = {
        gte: filterDate(filters, "startDate"),
        lte: filterDate(filters, "endDate"),
      };
    } else if (hasFilter(filters, "startDate")) {
      loanWhere.borrowedAt = { gte: filterDate(filters, "startDate") };
    } else if (hasFilter(filters, "endDate")) {
      loanWhere.borrowedAt = { lte: filterDate(filters, "endDate") };
    }

    const loans = await this.prisma.libraryLoan.findMany({
      where: loanWhere,
      include: {
        copy: {
          include: {
            book: {
              include: {
                category: true,
                copies: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
    });

    const bookStats = new Map<string, LibraryPopularBookStats>();

    for (const loan of loans) {
      if (!loan.copy || loan.copy.deletedAt || !loan.copy.book || loan.copy.book.deletedAt) continue;
      const book = loan.copy.book;
      const bookId = book.id;

      if (!bookStats.has(bookId)) {
        const availableCopies = book.copies.filter((c) => c.status === "AVAILABLE").length;
        bookStats.set(bookId, {
          bookCode: book.code,
          isbn: book.isbn || "-",
          title: book.title,
          author: book.author,
          categoryName: book.category?.name || "-",
          totalLoans: 0,
          borrowedCount: 0,
          returnedCount: 0,
          overdueCount: 0,
          lostCount: 0,
          totalCopies: book.copies.length,
          availableCopies,
        });
      }

      const stats = bookStats.get(bookId)!;
      stats.totalLoans += 1;

      switch (loan.status) {
        case "BORROWED":
          stats.borrowedCount += 1;
          break;
        case "RETURNED":
          stats.returnedCount += 1;
          break;
        case "OVERDUE":
          stats.overdueCount += 1;
          break;
        case "LOST":
          stats.lostCount += 1;
          break;
      }
    }

    const data = Array.from(bookStats.values()).sort((a, b) => b.totalLoans - a.totalLoans);

    return {
      title: "Library Popular Book Recap",
      columns: [
        { key: "bookCode", label: "Book Code", width: 15 },
        { key: "isbn", label: "ISBN", width: 15 },
        { key: "title", label: "Title", width: 40 },
        { key: "author", label: "Author", width: 25 },
        { key: "categoryName", label: "Category", width: 20 },
        { key: "totalLoans", label: "Total Loans", width: 15 },
        { key: "borrowedCount", label: "Borrowed", width: 15 },
        { key: "returnedCount", label: "Returned", width: 15 },
        { key: "overdueCount", label: "Overdue", width: 15 },
        { key: "lostCount", label: "Lost", width: 15 },
        { key: "totalCopies", label: "Total Copies", width: 15 },
        { key: "availableCopies", label: "Available Copies", width: 15 },
      ],
      rows: data,
    };
  }

  // =========================================================================================
  // HR & PAYROLL REPORTS
  // =========================================================================================

  private async getHrEmployeeRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.EmployeeProfileWhereInput = { deletedAt: null };
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (hasFilter(filters, "employmentType")) where.employmentType = filters.employmentType as never;
    if (filterString(filters, "positionId")) where.positionId = filterString(filters, "positionId");

    const employees = await this.prisma.employeeProfile.findMany({
      where,
      include: { position: true },
      orderBy: { fullName: "asc" },
    });

    return {
      title: "Employee Data Recap",
      columns: [
        { key: "employeeCode", label: "Employee Code", width: 20 },
        { key: "fullName", label: "Full Name", width: 30 },
        { key: "positionName", label: "Position", width: 24 },
        { key: "employmentType", label: "Employment Type", width: 20 },
        { key: "basicSalary", label: "Basic Salary", width: 18 },
        { key: "status", label: "Status", width: 20 },
        { key: "joinedAt", label: "Joined At", width: 16 },
      ],
      rows: employees.map((employee) => ({
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        positionName: employee.position?.name || "-",
        employmentType: employee.employmentType,
        basicSalary: formatReportCurrency(employee.basicSalary),
        status: employee.status,
        joinedAt: formatReportDate(employee.joinedAt),
      })),
    };
  }

  private async getHrAttendanceRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.EmployeeAttendanceWhereInput = { deletedAt: null };
    if (filterString(filters, "employeeId")) where.employeeId = filterString(filters, "employeeId");
    if (hasFilter(filters, "startDate") || hasFilter(filters, "endDate")) {
      where.date = {
        ...(hasFilter(filters, "startDate") ? { gte: filterDate(filters, "startDate") } : {}),
        ...(hasFilter(filters, "endDate") ? { lte: filterDate(filters, "endDate") } : {}),
      };
    }

    const attendance = await this.prisma.employeeAttendance.findMany({
      where,
      include: { employee: true },
      orderBy: [{ date: "desc" }, { employee: { fullName: "asc" } }],
    });

    return {
      title: "Employee Attendance Recap",
      subtitle:
        filters.startDate || hasFilter(filters, "endDate") ? `Period: ${filters.startDate || "-"} to ${filters.endDate || "-"}` : undefined,
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "employeeCode", label: "Employee Code", width: 20 },
        { key: "fullName", label: "Full Name", width: 30 },
        { key: "status", label: "Status", width: 20 },
        { key: "lateMinutes", label: "Late Minutes", width: 16 },
        { key: "workMinutes", label: "Work Minutes", width: 16 },
      ],
      rows: attendance.map((item) => ({
        date: formatReportDate(item.date),
        employeeCode: item.employee?.employeeCode || "-",
        fullName: item.employee?.fullName || "-",
        status: item.status,
        lateMinutes: item.lateMinutes,
        workMinutes: item.workMinutes ?? "-",
      })),
    };
  }

  private async getHrLeaveRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LeaveRequestWhereInput = { deletedAt: null };
    if (filterString(filters, "employeeId")) where.employeeId = filterString(filters, "employeeId");
    if (hasFilter(filters, "status")) where.status = filters.status as never;

    const leaves = await this.prisma.leaveRequest.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      title: "Employee Leave Recap",
      columns: [
        { key: "employeeCode", label: "Employee Code", width: 20 },
        { key: "fullName", label: "Full Name", width: 30 },
        { key: "type", label: "Leave Type", width: 20 },
        { key: "startDate", label: "Start Date", width: 16 },
        { key: "endDate", label: "End Date", width: 16 },
        { key: "totalDays", label: "Total Days", width: 12 },
        { key: "status", label: "Status", width: 20 },
      ],
      rows: leaves.map((leave) => ({
        employeeCode: leave.employee?.employeeCode || "-",
        fullName: leave.employee?.fullName || "-",
        type: leave.type,
        startDate: formatReportDate(leave.startDate),
        endDate: formatReportDate(leave.endDate),
        totalDays: leave.totalDays,
        status: leave.status,
      })),
    };
  }

  private async getPayrollPeriodRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PayrollPeriodWhereInput = { deletedAt: null };
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    if (filterNumber(filters, "year")!) where.year = filterNumber(filters, "year")!;

    const periods = await this.prisma.payrollPeriod.findMany({
      where,
      include: { _count: { select: { runs: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return {
      title: "Payroll Period Recap",
      columns: [
        { key: "code", label: "Code", width: 20 },
        { key: "name", label: "Name", width: 30 },
        { key: "month", label: "Month", width: 10 },
        { key: "year", label: "Year", width: 10 },
        { key: "runCount", label: "Runs", width: 10 },
        { key: "paymentDate", label: "Payment Date", width: 16 },
        { key: "status", label: "Status", width: 20 },
      ],
      rows: periods.map((period) => ({
        code: period.code,
        name: period.name,
        month: period.month,
        year: period.year,
        runCount: period._count.runs,
        paymentDate: formatReportDate(period.paymentDate),
        status: period.status,
      })),
    };
  }

  private async getPayrollRunRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PayrollRunWhereInput = { deletedAt: null };
    if (filterString(filters, "periodId")) where.periodId = filterString(filters, "periodId");
    if (hasFilter(filters, "paymentStatus")) where.status = filters.paymentStatus as never;

    const runs = await this.prisma.payrollRun.findMany({
      where,
      include: { employee: true, period: true },
      orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }, { employee: { fullName: "asc" } }],
    });

    return {
      title: "Payroll Run Recap",
      columns: [
        { key: "periodCode", label: "Period", width: 20 },
        { key: "employeeCode", label: "Employee", width: 20 },
        { key: "fullName", label: "Full Name", width: 30 },
        { key: "totalEarnings", label: "Earnings", width: 18 },
        { key: "totalDeductions", label: "Deductions", width: 18 },
        { key: "netAmount", label: "Net Amount", width: 20 },
        { key: "paymentStatus", label: "Status", width: 20 },
      ],
      rows: runs.map((run) => ({
        periodCode: run.period?.code || "-",
        employeeCode: run.employee?.employeeCode || "-",
        fullName: run.employee?.fullName || "-",
        totalEarnings: formatReportCurrency(run.totalEarnings),
        totalDeductions: formatReportCurrency(run.totalDeductions),
        netAmount: formatReportCurrency(run.netAmount),
        paymentStatus: run.status,
      })),
    };
  }

  private async getPayrollComponentRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PayrollComponentWhereInput = { deletedAt: null };
    if (hasFilter(filters, "type")) where.type = filters.type as never;

    const components = await this.prisma.payrollComponent.findMany({
      where,
      orderBy: { code: "asc" },
    });

    return {
      title: "Payroll Component Recap",
      columns: [
        { key: "code", label: "Code", width: 20 },
        { key: "name", label: "Name", width: 30 },
        { key: "type", label: "Type", width: 20 },
        { key: "calculationType", label: "Calculation", width: 18 },
        { key: "defaultAmount", label: "Default Amount", width: 20 },
        { key: "isActive", label: "Active", width: 10 },
      ],
      rows: components.map((component) => ({
        code: component.code,
        name: component.name,
        type: component.type,
        calculationType: component.calculationType,
        defaultAmount: formatReportCurrency(component.defaultAmount),
        isActive: component.isActive ? "Yes" : "No",
      })),
    };
  }

  private async getPayrollPaymentRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.PayslipWhereInput = { deletedAt: null, status: "PAID" };
    if (hasFilter(filters, "startDate") || hasFilter(filters, "endDate")) {
      where.paidAt = {
        ...(hasFilter(filters, "startDate") ? { gte: filterDate(filters, "startDate") } : {}),
        ...(hasFilter(filters, "endDate") ? { lte: filterDate(filters, "endDate") } : {}),
      };
    }
    if (filterString(filters, "periodId")) where.payrollRun = { periodId: filterString(filters, "periodId") };

    const payslips = await this.prisma.payslip.findMany({
      where,
      include: { payrollRun: { include: { employee: true, period: true } } },
      orderBy: { paidAt: "desc" },
    });

    return {
      title: "Payroll Payment Recap",
      subtitle:
        filters.startDate || hasFilter(filters, "endDate") ? `Period: ${filters.startDate || "-"} to ${filters.endDate || "-"}` : undefined,
      columns: [
        { key: "periodCode", label: "Period", width: 20 },
        { key: "employeeCode", label: "Employee", width: 20 },
        { key: "fullName", label: "Full Name", width: 30 },
        { key: "payslipNumber", label: "Payslip", width: 28 },
        { key: "netAmount", label: "Net Amount", width: 18 },
        { key: "paymentDate", label: "Payment Date", width: 20 },
        { key: "paymentMethod", label: "Method", width: 20 },
        { key: "paymentReference", label: "Reference", width: 24 },
      ],
      rows: payslips.map((payslip) => ({
        periodCode: payslip.payrollRun?.period?.code || "-",
        employeeCode: payslip.payrollRun?.employee?.employeeCode || "-",
        fullName: payslip.payrollRun?.employee?.fullName || "-",
        payslipNumber: payslip.payslipNumber,
        netAmount: formatReportCurrency(payslip.payrollRun?.netAmount),
        paymentDate: formatReportDate(payslip.paidAt),
        paymentMethod: payslip.paymentMethod || "-",
        paymentReference: payslip.paymentReference || "-",
      })),
    };
  }
}

function filterString(filters: ReportFilters, key: string): string | undefined {
  const value = filters[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function filterNumber(filters: ReportFilters, key: string): number | undefined {
  const value = filters[key];
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function filterDate(filters: ReportFilters, key: string): Date {
  const value = filters[key];
  if (typeof value === "number") {
    return new Date(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return new Date(Number(value));
  }
  return new Date(String(value));
}

function hasFilter(filters: ReportFilters, key: string): boolean {
  const value = filters[key];
  return value !== undefined && value !== null && value !== "";
}

function formatReportDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString().split("T")[0] : "-";
}

function formatReportCurrency(value: unknown) {
  return Number(value ?? 0).toLocaleString("id-ID");
}

function letterReportColumns() {
  return [
    { key: "letterNumber", label: "Letter Number", width: 24 },
    { key: "subject", label: "Subject", width: 40 },
    { key: "category", label: "Category", width: 14 },
    { key: "direction", label: "Direction", width: 14 },
    { key: "status", label: "Status", width: 14 },
    { key: "recipientName", label: "Recipient", width: 30 },
    { key: "createdBy", label: "Created By", width: 25 },
    { key: "approvedBy", label: "Approved By", width: 25 },
    { key: "issuedAt", label: "Issued At", width: 16 },
    { key: "createdAt", label: "Created At", width: 16 },
  ];
}

function letterReportRow(letter: LetterReportSource) {
  return {
    letterNumber: letter.letterNumber || "-",
    subject: letter.subject,
    category: letter.category,
    direction: letter.direction,
    status: letter.status,
    recipientName: letter.recipientName,
    createdBy: letter.createdBy?.name || "-",
    approvedBy: letter.approvedBy?.name || "-",
    issuedAt: letter.issuedAt ? letter.issuedAt.toISOString().split("T")[0] : "-",
    createdAt: letter.createdAt.toISOString().split("T")[0],
  };
}
