import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AnnouncementStatus, GradeStatus, InvoiceStatus, NotificationStatus } from "@prisma/client";

import { averageNormalizedPercent } from "../common/grade-scores";
import { PrismaService } from "../database/prisma.service";
import { DisciplineService } from "../discipline/discipline.service";

@Injectable()
export class StudentPortalService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DisciplineService) private readonly disciplineService: DisciplineService,
  ) {}

  async getStudentForUser(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId, deletedAt: null },
      include: { classroom: { include: { competency: true } } },
    });
    if (!student) {
      throw new NotFoundException("Profil siswa tidak ditemukan untuk user ini");
    }
    return student;
  }

  async getSummary(userId: string) {
    const student = await this.getStudentForUser(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [attendance, grades, invoices, unreadNotifications] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ["status"],
        where: { studentId: student.id, session: { date: { gte: startOfMonth, lte: endOfMonth } } },
        _count: { _all: true },
      }),
      this.prisma.grade.findMany({
        where: { studentId: student.id, status: { in: [GradeStatus.APPROVED, GradeStatus.PUBLISHED] } },
        select: { score: true, assessment: { select: { maxScore: true } } },
      }),
      this.prisma.invoice.findMany({
        where: {
          studentId: student.id,
          deletedAt: null,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
        },
        select: { total: true, paidAmount: true },
      }),
      this.prisma.notification.count({ where: { userId, status: NotificationStatus.UNREAD } }),
    ]);

    const attendanceSummary: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, PERMIT: 0, SICK: 0 };
    for (const row of attendance) {
      attendanceSummary[row.status] = row._count._all;
    }
    const totalSessions = Object.values(attendanceSummary).reduce((a, b) => a + b, 0);
    const avgScore = averageNormalizedPercent(grades);
    const outstanding = invoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)), 0);

    return {
      student: {
        id: student.id,
        nis: student.nis,
        nisn: student.nisn,
        name: student.name,
        classroom: student.classroom
          ? {
              id: student.classroom.id,
              name: student.classroom.name,
              code: student.classroom.code,
            }
          : null,
        competency: student.classroom?.competency?.name ?? null,
      },
      counts: {
        attendanceThisMonth: attendanceSummary,
        totalSessionsThisMonth: totalSessions,
        approvedGradeCount: grades.length,
        averageScore: avgScore,
        outstandingInvoices: invoices.length,
        outstandingAmount: outstanding,
        unreadNotifications,
      },
    };
  }

  async getProfile(userId: string) {
    const student = await this.getStudentForUser(userId);
    const guardians = await this.prisma.studentGuardian.findMany({
      where: { studentId: student.id },
      include: { guardian: true },
      orderBy: { isPrimary: "desc" },
    });
    return {
      student,
      guardians: guardians.map((sg) => ({ ...sg.guardian, isPrimary: sg.isPrimary })),
    };
  }

  async listSchedules(userId: string) {
    const student = await this.getStudentForUser(userId);
    if (!student.classroomId) return [];
    return this.prisma.schedule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        teachingAssignment: { classroomId: student.classroomId, deletedAt: null, isActive: true },
      },
      include: {
        teachingAssignment: { include: { subject: true, teacher: true } },
        room: true,
        lessonHour: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { lessonHour: { startTime: "asc" } }],
    });
  }

  async listAttendance(userId: string, limit = 30) {
    const student = await this.getStudentForUser(userId);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: {
        session: {
          include: {
            schedule: {
              include: {
                teachingAssignment: { include: { subject: true } },
                lessonHour: true,
              },
            },
          },
        },
      },
      orderBy: { session: { date: "desc" } },
      take: limit,
    });
    const summary: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, PERMIT: 0, SICK: 0 };
    for (const r of records) {
      summary[r.status] = (summary[r.status] ?? 0) + 1;
    }
    return { summary, total: records.length, records };
  }

  async listGrades(userId: string) {
    const student = await this.getStudentForUser(userId);
    return this.prisma.grade.findMany({
      // Only release grades that have been approved or published by the teacher/admin
      where: { studentId: student.id, status: { in: ["APPROVED", "PUBLISHED"] } },
      include: {
        assessment: {
          include: {
            teachingAssignment: {
              include: { subject: true, teacher: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listInvoices(userId: string) {
    const student = await this.getStudentForUser(userId);
    return this.prisma.invoice.findMany({
      where: { studentId: student.id, deletedAt: null },
      include: { items: { include: { paymentCategory: true } }, academicYear: true, semester: true },
      orderBy: { issueDate: "desc" },
    });
  }

  async getDisciplineSummary(userId: string) {
    const student = await this.getStudentForUser(userId);
    return this.disciplineService.getStudentSummary(student.id);
  }

  async listAnnouncements(userId: string, limit = 10) {
    return this.prisma.announcement.findMany({
      where: { status: AnnouncementStatus.PUBLISHED, deletedAt: null },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  }

  async listNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // Phase 10.5 — Student Dashboard
  async getDashboard(userId: string) {
    const student = await this.getStudentForUser(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const dayOfWeek = this.toDayOfWeek(now);

    const [attendanceRows, gradesApproved, gradesAll, unpaidInvoices, unreadNotifications, todaySchedules, recentAnnouncements] =
      await Promise.all([
        this.prisma.attendanceRecord.groupBy({
          by: ["status"],
          _count: true,
          where: { studentId: student.id, session: { date: { gte: startOfMonth, lte: endOfMonth } } },
        }),
        this.prisma.grade.findMany({
          where: { studentId: student.id, status: GradeStatus.APPROVED },
          select: { score: true, assessment: { select: { maxScore: true, type: true } } },
        }),
        this.prisma.grade.findMany({
          where: { studentId: student.id },
          select: { status: true, score: true },
        }),
        this.prisma.invoice.findMany({
          where: {
            studentId: student.id,
            deletedAt: null,
            status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
          },
          select: { total: true, paidAmount: true },
        }),
        this.prisma.notification.count({ where: { userId, status: NotificationStatus.UNREAD } }),
        student.classroomId
          ? this.prisma.schedule.findMany({
              where: {
                isActive: true,
                deletedAt: null,
                dayOfWeek,
                teachingAssignment: { classroomId: student.classroomId, deletedAt: null, isActive: true },
              },
              include: {
                teachingAssignment: { include: { subject: true, teacher: true } },
                room: true,
                lessonHour: true,
              },
              orderBy: { lessonHour: { startTime: "asc" } },
            })
          : Promise.resolve([]),
        this.prisma.announcement.findMany({
          where: { status: AnnouncementStatus.PUBLISHED, deletedAt: null },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: { id: true, title: true, content: true, publishedAt: true },
        }),
      ]);

    const attendanceSummary: Record<string, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      PERMIT: 0,
      SICK: 0,
    };
    for (const r of attendanceRows) attendanceSummary[r.status] = r._count;
    const totalSessions = Object.values(attendanceSummary).reduce((a, b) => a + b, 0);
    const present = attendanceSummary.PRESENT + attendanceSummary.LATE;
    const attendancePercent = totalSessions === 0 ? 0 : Math.round((present / totalSessions) * 100);

    const avgScore =
      gradesApproved.length === 0
        ? 0
        : Math.round((gradesApproved.reduce((s, g) => s + (g.score / g.assessment.maxScore) * 100, 0) / gradesApproved.length) * 10) / 10;

    const gradeBreakdown = { APPROVED: 0, SUBMITTED: 0, DRAFT: 0, PUBLISHED: 0 } as Record<string, number>;
    for (const g of gradesAll) gradeBreakdown[g.status] = (gradeBreakdown[g.status] ?? 0) + 1;

    const unpaidAmount = unpaidInvoices.reduce((s, inv) => s + (Number(inv.total) - Number(inv.paidAmount)), 0);

    return {
      student: {
        id: student.id,
        nis: student.nis,
        nisn: student.nisn,
        name: student.name,
        classroom: student.classroom ? { id: student.classroom.id, name: student.classroom.name, code: student.classroom.code } : null,
        competency: student.classroom?.competency?.name ?? null,
        photoUrl: student.photoUrl,
      },
      counts: {
        attendancePercent,
        totalSessionsThisMonth: totalSessions,
        attendanceBreakdown: attendanceSummary,
        approvedGradeCount: gradesApproved.length,
        pendingGradeCount: (gradeBreakdown.SUBMITTED ?? 0) + (gradeBreakdown.DRAFT ?? 0),
        averageScore: avgScore,
        unpaidInvoices: unpaidInvoices.length,
        unpaidAmount,
        unreadNotifications,
      },
      todaySchedules,
      recentAnnouncements,
    };
  }

  async getTodaySchedules(userId: string) {
    const student = await this.getStudentForUser(userId);
    if (!student.classroomId) return [];
    const dayOfWeek = this.toDayOfWeek(new Date());
    return this.prisma.schedule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        dayOfWeek,
        teachingAssignment: { classroomId: student.classroomId, deletedAt: null, isActive: true },
      },
      include: {
        teachingAssignment: { include: { subject: true, teacher: true } },
        room: true,
        lessonHour: true,
      },
      orderBy: { lessonHour: { startTime: "asc" } },
    });
  }

  async getAttendanceSummary(userId: string) {
    const student = await this.getStudentForUser(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyRows, allTimeRows] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ["status"],
        _count: true,
        where: { studentId: student.id, session: { date: { gte: startOfMonth } } },
      }),
      this.prisma.attendanceRecord.groupBy({ by: ["status"], _count: true, where: { studentId: student.id } }),
    ]);

    const buildSummary = (rows: { status: string; _count: number }[]) => {
      const summary: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, PERMIT: 0, SICK: 0 };
      for (const r of rows) summary[r.status] = r._count;
      const total = Object.values(summary).reduce((a, b) => a + b, 0);
      const present = summary.PRESENT + summary.LATE;
      return { summary, total, present, percent: total === 0 ? 0 : Math.round((present / total) * 100) };
    };

    return {
      thisMonth: buildSummary(monthlyRows),
      allTime: buildSummary(allTimeRows),
    };
  }

  async getGradeSummary(userId: string) {
    const student = await this.getStudentForUser(userId);
    const grades = await this.prisma.grade.findMany({
      where: { studentId: student.id },
      include: {
        assessment: {
          include: { teachingAssignment: { include: { subject: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const approved = grades.filter((g) => g.status === "APPROVED");
    const pending = grades.filter((g) => g.status === "DRAFT" || g.status === "SUBMITTED");

    const bySubject = new Map<string, { subject: string; total: number; count: number }>();
    for (const g of approved) {
      const subject = g.assessment.teachingAssignment?.subject?.name ?? "Lainnya";
      const entry = bySubject.get(subject) ?? { subject, total: 0, count: 0 };
      entry.total += (g.score / g.assessment.maxScore) * 100;
      entry.count += 1;
      bySubject.set(subject, entry);
    }
    const perSubject = Array.from(bySubject.values())
      .map((s) => ({ subject: s.subject, average: Math.round((s.total / s.count) * 10) / 10, count: s.count }))
      .sort((a, b) => b.average - a.average);

    const overallAvg =
      approved.length === 0
        ? 0
        : Math.round((approved.reduce((s, g) => s + (g.score / g.assessment.maxScore) * 100, 0) / approved.length) * 10) / 10;

    return {
      overall: overallAvg,
      approvedCount: approved.length,
      pendingCount: pending.length,
      totalCount: grades.length,
      perSubject,
    };
  }

  async getInvoiceSummary(userId: string) {
    const student = await this.getStudentForUser(userId);
    const invoices = await this.prisma.invoice.findMany({
      where: { studentId: student.id, deletedAt: null },
      select: { status: true, total: true, paidAmount: true, dueDate: true },
    });

    const statusCounts: Record<string, number> = { PAID: 0, PARTIAL: 0, ISSUED: 0, OVERDUE: 0, CANCELLED: 0 };
    let totalUnpaid = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    for (const inv of invoices) {
      statusCounts[inv.status] = (statusCounts[inv.status] ?? 0) + 1;
      const outstanding = Number(inv.total) - Number(inv.paidAmount);
      if (outstanding > 0) totalUnpaid += outstanding;
      totalPaid += Number(inv.paidAmount);
      if (inv.status === "OVERDUE") overdueCount += 1;
    }

    return {
      totalInvoices: invoices.length,
      statusCounts,
      totalUnpaid,
      totalPaid,
      overdueCount,
    };
  }

  async getRecentAnnouncements(userId: string, limit = 5) {
    return this.prisma.announcement.findMany({
      where: { status: AnnouncementStatus.PUBLISHED, deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: { id: true, title: true, content: true, publishedAt: true },
    });
  }

  private toDayOfWeek(date: Date) {
    const map = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
    return map[date.getDay()];
  }
}
