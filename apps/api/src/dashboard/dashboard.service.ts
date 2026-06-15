import { Socket } from "node:net";

import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ExpenseStatus,
  InternshipStatus,
  InvoiceStatus,
  JobStatus,
  NotificationStatus,
  PaymentStatus,
  PersonStatus,
  PpdbRegistrationStatus,
} from "@prisma/client";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class DashboardService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getSummary() {
    const now = new Date();
    const [totalUsers, activeUsers, inactiveUsers, suspendedUsers, totalRoles, totalPermissions, totalAuditLogs, activeRefreshTokens] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
        this.prisma.user.count({ where: { deletedAt: null, status: "INACTIVE" } }),
        this.prisma.user.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
        this.prisma.role.count(),
        this.prisma.permission.count(),
        this.prisma.auditLog.count(),
        this.prisma.refreshToken.count({
          where: {
            expiresAt: { gt: now },
            revokedAt: null,
          },
        }),
      ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
      },
      roles: {
        total: totalRoles,
      },
      permissions: {
        total: totalPermissions,
      },
      auditLogs: {
        total: totalAuditLogs,
      },
      refreshTokens: {
        active: activeRefreshTokens,
      },
    };
  }

  async getUserRoleSummary() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: true,
        users: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      isActive: role.isActive,
      totalUsers: role.users.filter(({ user }) => !user.deletedAt).length,
      activeUsers: role.users.filter(({ user }) => !user.deletedAt && user.status === "ACTIVE").length,
      totalPermissions: role.permissions.length,
    }));
  }

  async getRecentActivities() {
    const activities = await this.prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      entity: activity.entity,
      entityId: activity.entityId,
      metadata: activity.metadata,
      actor: activity.actor
        ? {
            id: activity.actor.id,
            email: activity.actor.email,
            name: activity.actor.name,
          }
        : null,
      createdAt: activity.createdAt,
    }));
  }

  async getSystemStatus() {
    const redisUrl = this.configService.getOrThrow<string>("REDIS_URL");
    const redis = await this.checkRedis(redisUrl);

    await this.prisma.$queryRaw`SELECT 1`;

    return {
      api: {
        status: "ok",
        version: process.env.npm_package_version ?? "0.0.0",
        uptime: Math.round(process.uptime()),
      },
      database: {
        provider: "postgresql",
        status: "connected",
      },
      redis,
      generatedAt: new Date().toISOString(),
    };
  }

  private async checkRedis(redisUrl: string) {
    try {
      const url = new URL(redisUrl);
      const host = url.hostname || "localhost";
      const port = Number(url.port || 6379);
      const available = await this.canConnect(host, port);

      return {
        configured: true,
        available,
        status: available ? "available" : "unavailable",
        host,
        port,
      };
    } catch {
      return {
        configured: Boolean(redisUrl),
        available: false,
        status: "invalid_config",
      };
    }
  }

  private canConnect(host: string, port: number) {
    return new Promise<boolean>((resolve) => {
      const socket = new Socket();

      socket.setTimeout(750);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });
  }

  // Phase 10.5 — Dashboard Enhancement
  async getOverview() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      activeStudents,
      activeTeachers,
      activeStaffs,
      totalGuardians,
      totalClassrooms,
      totalSubjects,
      attendanceThisWeek,
      assessmentsThisSemester,
      invoicesIssued,
      verifiedPayments,
      outstandingInvoices,
      expensesThisMonth,
      activePpdbPeriods,
      activePpdbRegistrations,
      ongoingInternships,
      publishedJobs,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null, status: PersonStatus.ACTIVE } }),
      this.prisma.teacher.count({ where: { deletedAt: null, status: PersonStatus.ACTIVE } }),
      this.prisma.staff.count({ where: { deletedAt: null, status: PersonStatus.ACTIVE } }),
      this.prisma.guardian.count(),
      this.prisma.classroom.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.subject.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.attendanceSession.count({
        where: { deletedAt: null, date: { gte: startOfWeek, lte: endOfWeek } },
      }),
      this.prisma.assessment.count({
        where: { deletedAt: null, teachingAssignment: { isActive: true, deletedAt: null } },
      }),
      this.prisma.invoice.count({ where: { deletedAt: null } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.VERIFIED } }),
      this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
        },
        select: { total: true, paidAmount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          deletedAt: null,
          status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID] },
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.ppdbPeriod.count({ where: { isActive: true } }),
      this.prisma.ppdbRegistration.count({
        where: {
          status: { in: [PpdbRegistrationStatus.SUBMITTED, PpdbRegistrationStatus.VERIFIED, PpdbRegistrationStatus.REVISION] },
        },
      }),
      this.prisma.internship.count({ where: { status: InternshipStatus.ONGOING } }),
      this.prisma.jobVacancy.count({ where: { deletedAt: null, status: JobStatus.PUBLISHED } }),
      this.prisma.notification.count({ where: { status: NotificationStatus.UNREAD } }),
    ]);

    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)), 0);

    return {
      people: {
        studentsActive: activeStudents,
        teachersActive: activeTeachers,
        staffsActive: activeStaffs,
        guardians: totalGuardians,
      },
      academic: {
        classrooms: totalClassrooms,
        subjects: totalSubjects,
        attendanceSessionsThisWeek: attendanceThisWeek,
        assessmentsThisSemester,
      },
      finance: {
        invoicesIssued,
        verifiedPayments,
        outstandingInvoices: outstandingInvoices.length,
        outstandingAmount,
        expensesThisMonth: Number(expensesThisMonth._sum.amount ?? 0),
      },
      ppdb: {
        activePeriods: activePpdbPeriods,
        activeRegistrations: activePpdbRegistrations,
      },
      programs: {
        ongoingInternships,
        publishedJobs,
      },
      notifications: {
        unread: unreadNotifications,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getAcademicSummary() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [byStatus, studentsByGender, attendanceMonthly, topSubjects] = await Promise.all([
      this.prisma.student.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
      this.prisma.student.groupBy({ by: ["gender"], _count: true, where: { deletedAt: null } }),
      this.prisma.attendanceRecord.groupBy({
        by: ["status"],
        _count: true,
        where: {
          session: {
            date: { gte: startOfWeek, lte: endOfWeek },
            deletedAt: null,
          },
        },
      }),
      this.prisma.teachingAssignment.groupBy({
        by: ["subjectId"],
        _count: true,
        where: { deletedAt: null, isActive: true },
        orderBy: { _count: { subjectId: "desc" } },
        take: 5,
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) statusCounts[row.status] = row._count;

    const genderCounts: Record<string, number> = { MALE: 0, FEMALE: 0 };
    for (const row of studentsByGender) genderCounts[row.gender] = row._count;

    const attendanceCounts: Record<string, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      PERMIT: 0,
      SICK: 0,
    };
    for (const row of attendanceMonthly) attendanceCounts[row.status] = row._count;

    const subjectIds = topSubjects.map((s) => s.subjectId);
    const subjects = subjectIds.length
      ? await this.prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } })
      : [];
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    return {
      studentsByStatus: statusCounts,
      studentsByGender: genderCounts,
      attendanceThisWeek: attendanceCounts,
      topSubjects: topSubjects.map((s) => ({
        subject: subjectMap.get(s.subjectId)
          ? { id: s.subjectId, ...subjectMap.get(s.subjectId) }
          : { id: s.subjectId, name: "Unknown", code: "-" },
        count: s._count,
      })),
    };
  }

  async getFinanceSummary() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [invoicesAggregate, verifiedPaymentsAggregate, expensesAggregate, outstandingInvoices, paymentsByMonth, expensesByMonth] =
      await Promise.all([
        this.prisma.invoice.aggregate({
          where: { deletedAt: null },
          _sum: { total: true, paidAmount: true },
          _count: true,
        }),
        this.prisma.payment.aggregate({
          where: { status: PaymentStatus.VERIFIED },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.expense.aggregate({
          where: { deletedAt: null, status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID] } },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.invoice.findMany({
          where: {
            deletedAt: null,
            status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
          },
          select: { total: true, paidAmount: true },
        }),
        this.prisma.payment.findMany({
          where: { status: PaymentStatus.VERIFIED, paidAt: { gte: startOfYear } },
          select: { amount: true, paidAt: true },
        }),
        this.prisma.expense.findMany({
          where: { deletedAt: null, status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID] }, date: { gte: startOfYear } },
          select: { amount: true, date: true },
        }),
      ]);

    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)), 0);

    const monthlyMap = new Map<string, { income: number; expense: number }>();
    for (const p of paymentsByMonth) {
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key) ?? { income: 0, expense: 0 };
      entry.income += Number(p.amount);
      monthlyMap.set(key, entry);
    }
    for (const e of expensesByMonth) {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key) ?? { income: 0, expense: 0 };
      entry.expense += Number(e.amount);
      monthlyMap.set(key, entry);
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    return {
      invoices: {
        count: invoicesAggregate._count,
        total: Number(invoicesAggregate._sum.total ?? 0),
        paid: Number(invoicesAggregate._sum.paidAmount ?? 0),
      },
      payments: {
        count: verifiedPaymentsAggregate._count,
        total: Number(verifiedPaymentsAggregate._sum.amount ?? 0),
      },
      expenses: {
        count: expensesAggregate._count,
        total: Number(expensesAggregate._sum.amount ?? 0),
      },
      outstanding: {
        count: outstandingInvoices.length,
        amount: outstandingAmount,
      },
      monthly,
    };
  }

  async getPpdbSummary() {
    const [byStatus, byDepartment, byPeriod, totalRegistrations, activePeriods] = await Promise.all([
      this.prisma.ppdbRegistration.groupBy({ by: ["status"], _count: true }),
      this.prisma.ppdbRegistration.groupBy({
        by: ["selectedDepartmentId"],
        _count: true,
        where: { selectedDepartmentId: { not: null } },
      }),
      this.prisma.ppdbRegistration.groupBy({ by: ["periodId"], _count: true }),
      this.prisma.ppdbRegistration.count(),
      this.prisma.ppdbPeriod.findMany({
        where: { isActive: true },
        select: { id: true, name: true, startDate: true, endDate: true, quota: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      SUBMITTED: 0,
      VERIFIED: 0,
      REVISION: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      CONVERTED: 0,
    };
    for (const row of byStatus) statusCounts[row.status] = row._count;

    const departmentIds = byDepartment.map((d) => d.selectedDepartmentId).filter((id): id is string => Boolean(id));
    const departments = departmentIds.length
      ? await this.prisma.department.findMany({
          where: { id: { in: departmentIds as string[] } },
          select: { id: true, name: true, code: true },
        })
      : [];
    const departmentMap = new Map(departments.map((d) => [d.id, d]));

    const periodIds = byPeriod.map((p) => p.periodId);
    const periods = periodIds.length
      ? await this.prisma.ppdbPeriod.findMany({ where: { id: { in: periodIds } }, select: { id: true, name: true } })
      : [];
    const periodMap = new Map(periods.map((p) => [p.id, p]));

    return {
      totalRegistrations,
      activePeriods,
      byStatus: statusCounts,
      byDepartment: byDepartment.map((d) => ({
        department: departmentMap.get(d.selectedDepartmentId as string) ?? { id: d.selectedDepartmentId, name: "Unknown", code: "-" },
        count: d._count,
      })),
      byPeriod: byPeriod.map((p) => ({
        period: periodMap.get(p.periodId) ?? { id: p.periodId, name: "Unknown" },
        count: p._count,
      })),
    };
  }

  async getPeopleSummary() {
    const [studentsByStatus, studentsByGender, teachersByStatus, staffsByStatus, guardiansTotal, byRole] = await Promise.all([
      this.prisma.student.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
      this.prisma.student.groupBy({ by: ["gender"], _count: true, where: { deletedAt: null } }),
      this.prisma.teacher.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
      this.prisma.staff.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
      this.prisma.guardian.count(),
      this.prisma.userRole.groupBy({ by: ["roleId"], _count: true, where: { user: { deletedAt: null } } }),
    ]);

    const studentStatusMap: Record<string, number> = {};
    for (const row of studentsByStatus) studentStatusMap[row.status] = row._count;
    const genderMap: Record<string, number> = { MALE: 0, FEMALE: 0 };
    for (const row of studentsByGender) genderMap[row.gender] = row._count;
    const teacherStatusMap: Record<string, number> = {};
    for (const row of teachersByStatus) teacherStatusMap[row.status] = row._count;
    const staffStatusMap: Record<string, number> = {};
    for (const row of staffsByStatus) staffStatusMap[row.status] = row._count;

    const roleIds = byRole.map((r) => r.roleId);
    const roles = roleIds.length ? await this.prisma.role.findMany({ where: { id: { in: roleIds } } }) : [];
    const roleMap = new Map(roles.map((r) => [r.id, r]));

    return {
      students: {
        byStatus: studentStatusMap,
        byGender: genderMap,
        total: studentsByStatus.reduce((sum, r) => sum + r._count, 0),
      },
      teachers: {
        byStatus: teacherStatusMap,
        total: teachersByStatus.reduce((sum, r) => sum + r._count, 0),
      },
      staffs: {
        byStatus: staffStatusMap,
        total: staffsByStatus.reduce((sum, r) => sum + r._count, 0),
      },
      guardians: { total: guardiansTotal },
      usersByRole: byRole.map((r) => ({
        role: roleMap.get(r.roleId) ?? { id: r.roleId, name: "Unknown", slug: "unknown" },
        count: r._count,
      })),
    };
  }

  async getActivityFeed(limit = 20) {
    return this.prisma.auditLog.findMany({
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getQuickAlerts() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [overdueInvoices, recentUnread, recentFailedPayments, currentPpdbOpen, lowQuota, todayAttendanceMissing] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          status: InvoiceStatus.OVERDUE,
        },
        include: { student: { select: { name: true, nis: true } } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      this.prisma.notification.count({ where: { status: NotificationStatus.UNREAD } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.REJECTED } }),
      this.prisma.ppdbPeriod.findFirst({
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
        orderBy: { startDate: "desc" },
      }),
      this.prisma.ppdbPeriod.findMany({
        where: { isActive: true, quota: { not: null } },
        include: { _count: { select: { registrations: true } } },
      }),
      this.prisma.attendanceSession.count({
        where: {
          deletedAt: null,
          date: { gte: startOfWeek, lte: endOfWeek },
          records: { none: {} },
        },
      }),
    ]);

    const lowQuotaAlerts = lowQuota
      .filter((p) => p.quota && p._count.registrations / p.quota >= 0.8)
      .map((p) => ({
        periodId: p.id,
        name: p.name,
        registrations: p._count.registrations,
        quota: p.quota,
        percent: p.quota ? Math.round((p._count.registrations / p.quota) * 100) : 0,
      }));

    return {
      overdueInvoices: {
        count: overdueInvoices.length,
        items: overdueInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          outstanding: Number(inv.total) - Number(inv.paidAmount),
          student: inv.student,
        })),
      },
      unreadNotifications: recentUnread,
      rejectedPayments: recentFailedPayments,
      ppdbActive: currentPpdbOpen ? { id: currentPpdbOpen.id, name: currentPpdbOpen.name, endDate: currentPpdbOpen.endDate } : null,
      lowQuotaPeriods: lowQuotaAlerts,
      attendanceMissing: todayAttendanceMissing,
    };
  }
}
