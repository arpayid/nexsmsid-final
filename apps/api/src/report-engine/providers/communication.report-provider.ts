import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ReportDataResult } from "../report-engine.types";
import { ReportProvider, ReportFilters, filterString, hasFilter, formatReportDate } from "../report-provider.interface";
import { Prisma } from "@prisma/client";

@Injectable()
export class CommunicationReportProvider implements ReportProvider {
  readonly reports: Record<string, (f: ReportFilters) => Promise<ReportDataResult>>;

  constructor(private prisma: PrismaService) {
    this.reports = {
      "letter-recap": (f) => this.getLetterRecap(f),
      "outgoing-letter-recap": (f) => this.getLetterRecap({ ...f, direction: "OUTGOING" }),
      "incoming-letter-recap": (f) => this.getLetterRecap({ ...f, direction: "INCOMING" }),
      "letter-approval-recap": this.getLetterApprovalRecap.bind(this),
      "announcement-recap": this.getAnnouncementRecap.bind(this),
      "notification-recap": this.getNotificationRecap.bind(this),
      "job-application-recap": this.getJobApplicationRecap.bind(this),
      "tracer-study-recap": this.getTracerStudyRecap.bind(this),
      "discipline-violation-recap": this.getDisciplineViolationRecap.bind(this),
      "student-discipline-summary": this.getStudentDisciplineSummary.bind(this),
      "counseling-case-recap": this.getCounselingCaseRecap.bind(this),
    };
  }

  supportedReports(): string[] {
    return Object.keys(this.reports);
  }
  async getData(reportCode: string, filters: ReportFilters): Promise<ReportDataResult> {
    const fn = this.reports[reportCode];
    if (!fn) throw new Error(`Report ${reportCode} not handled by CommunicationReportProvider`);
    return fn(filters);
  }

  private letterColumns() {
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

  private letterRow(l: any) {
    return {
      letterNumber: l.letterNumber || "-",
      subject: l.subject,
      category: l.category,
      direction: l.direction,
      status: l.status,
      recipientName: l.recipientName,
      createdBy: l.createdBy?.name || "-",
      approvedBy: l.approvedBy?.name || "-",
      issuedAt: l.issuedAt ? l.issuedAt.toISOString().split("T")[0] : "-",
      createdAt: l.createdAt.toISOString().split("T")[0],
    };
  }

  private async getLetterRecap(f: ReportFilters & { direction?: string }): Promise<ReportDataResult> {
    const where: Prisma.LetterWhereInput = { deletedAt: null };
    if (f.direction) where.direction = f.direction as never;
    if (hasFilter(f, "status")) where.status = f.status as never;
    if (filterString(f, "startDate") && filterString(f, "endDate"))
      where.createdAt = { gte: new Date(String(f.startDate)), lte: new Date(String(f.endDate)) };
    const letters = await this.prisma.letter.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { createdBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return {
      title: f.direction ? `${f.direction} Letter Recap` : "Letter Recap",
      columns: this.letterColumns(),
      rows: letters.map((l) => this.letterRow(l)),
    };
  }

  private async getLetterApprovalRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LetterWhereInput = { deletedAt: null, status: "PENDING_APPROVAL" as any };
    if (filterString(f, "approverId")) where.approvedById = filterString(f, "approverId");
    const letters = await this.prisma.letter.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { createdBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return { title: "Letter Approval Recap", columns: this.letterColumns(), rows: letters.map((l) => this.letterRow(l)) };
  }

  private async getAnnouncementRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.announcement.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Announcement Recap",
      columns: [
        { key: "title", label: "Title", width: 40 },
        { key: "audience", label: "Audience", width: 20 },
        { key: "status", label: "Status", width: 15 },
        { key: "date", label: "Created", width: 15 },
        { key: "by", label: "Created By", width: 25 },
      ],
      rows: items.map((a) => ({
        title: a.title,
        audience: a.audience,
        status: a.status,
        date: formatReportDate(a.createdAt),
        by: a.createdBy?.name || "-",
      })),
    };
  }

  private async getNotificationRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.notification.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null } as any,
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Notification Recap",
      columns: [
        { key: "title", label: "Title", width: 40 },
        { key: "type", label: "Type", width: 15 },
        { key: "channel", label: "Channel", width: 15 },
        { key: "status", label: "Status", width: 15 },
        { key: "date", label: "Created", width: 15 },
      ],
      rows: items.map((n: any) => ({
        title: n.title,
        type: n.type,
        channel: n.channel,
        status: n.status,
        date: formatReportDate(n.createdAt),
      })),
    };
  }

  private async getJobApplicationRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.jobApplication.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null } as any,
      include: { vacancy: true } as any,
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Job Application Recap",
      columns: [
        { key: "name", label: "Applicant", width: 25 },
        { key: "position", label: "Position", width: 30 },
        { key: "status", label: "Status", width: 15 },
        { key: "date", label: "Applied", width: 15 },
      ],
      rows: items.map((i: any) => ({
        name: i.name,
        position: i.vacancy?.title || "-",
        status: i.status,
        date: formatReportDate(i.createdAt),
      })),
    };
  }

  private async getTracerStudyRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.tracerStudy.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null } as any,
      include: { alumni: { select: { name: true, graduationYear: true } } } as any,
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Tracer Study Recap",
      columns: [
        { key: "alumni", label: "Alumni", width: 25 },
        { key: "year", label: "Grad Year", width: 12 },
        { key: "status", label: "Status", width: 15 },
        { key: "employment", label: "Employment", width: 25 },
        { key: "date", label: "Filled", width: 15 },
      ],
      rows: items.map((i: any) => ({
        alumni: i.alumni?.name || "-",
        year: i.alumni?.graduationYear || "-",
        status: i.employmentStatus || "-",
        employment: i.companyName || "-",
        date: formatReportDate(i.createdAt),
      })),
    };
  }

  private async getDisciplineViolationRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.disciplineViolation.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { student: true, rule: true, reportedBy: { select: { name: true } } } as any,
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Discipline Violation Recap",
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "student", label: "Student", width: 25 },
        { key: "violation", label: "Violation", width: 30 },
        { key: "sanction", label: "Sanction", width: 25 },
        { key: "reportedBy", label: "Recorded By", width: 20 },
      ],
      rows: items.map((v: any) => ({
        date: formatReportDate(v.createdAt),
        student: v.student.name,
        violation: v.rule?.name || "-",
        sanction: v.sanction || "-",
        reportedBy: v.reportedBy?.name || "-",
      })),
    };
  }

  private async getStudentDisciplineSummary(f: ReportFilters): Promise<ReportDataResult> {
    const violations = await this.prisma.disciplineViolation.findMany({
      where: { deletedAt: null },
      include: { student: true, rule: true },
    });
    const studentMap = new Map<string, { name: string; violations: number; totalPoints: number; lastDate: string }>();
    for (const v of violations) {
      if (!studentMap.has(v.studentId)) studentMap.set(v.studentId, { name: v.student.name, violations: 0, totalPoints: 0, lastDate: "" });
      const entry = studentMap.get(v.studentId)!;
      entry.violations++;
      entry.totalPoints -= v.rule?.point ?? 0;
      const d = formatReportDate(v.createdAt);
      if (d > entry.lastDate) entry.lastDate = d;
    }
    return {
      title: "Student Discipline Summary",
      columns: [
        { key: "name", label: "Student", width: 25 },
        { key: "violations", label: "Violations", width: 12 },
        { key: "points", label: "Points", width: 12 },
        { key: "last", label: "Last Activity", width: 15 },
      ],
      rows: Array.from(studentMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, Number(f.limit || 5000)),
    };
  }

  private async getCounselingCaseRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.CounselingCaseWhereInput = { deletedAt: null };
    if (hasFilter(f, "status")) where.status = f.status as never;
    if (filterString(f, "studentId")) where.studentId = filterString(f, "studentId");
    const items = await this.prisma.counselingCase.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { student: true, counselor: { select: { name: true } } } as any,
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Counseling Case Recap",
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "student", label: "Student", width: 25 },
        { key: "type", label: "Type", width: 20 },
        { key: "status", label: "Status", width: 15 },
        { key: "counselor", label: "Counselor", width: 20 },
      ],
      rows: items.map((c: any) => ({
        date: formatReportDate(c.createdAt),
        student: c.student.name,
        type: c.caseType || c.type,
        status: c.status,
        counselor: c.counselor?.name || "-",
      })),
    };
  }
}
