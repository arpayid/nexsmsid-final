import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AnnouncementStatus, GradeStatus, NotificationStatus } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class TeacherPortalService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getTeacherForUser(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!teacher) {
      throw new NotFoundException("Profil guru tidak ditemukan untuk user ini");
    }
    return teacher;
  }

  async getSummary(userId: string) {
    const teacher = await this.getTeacherForUser(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [taCount, scheduleCount, sessionThisMonth, assessmentCount, pendingScores, unreadNotifications] = await Promise.all([
      this.prisma.teachingAssignment.count({ where: { teacherId: teacher.id, deletedAt: null, isActive: true } }),
      this.prisma.schedule.count({
        where: {
          isActive: true,
          deletedAt: null,
          teachingAssignment: { teacherId: teacher.id, deletedAt: null },
        },
      }),
      this.prisma.attendanceSession.count({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          deletedAt: null,
          schedule: { teachingAssignment: { teacherId: teacher.id, deletedAt: null } },
        },
      }),
      this.prisma.assessment.count({
        where: {
          deletedAt: null,
          isActive: true,
          teachingAssignment: { teacherId: teacher.id, deletedAt: null },
        },
      }),
      this.prisma.assessment.count({
        where: {
          deletedAt: null,
          teachingAssignment: { teacherId: teacher.id, deletedAt: null },
          grades: { some: { status: GradeStatus.DRAFT } },
        },
      }),
      this.prisma.notification.count({ where: { userId, status: NotificationStatus.UNREAD } }),
    ]);

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        email: teacher.email,
      },
      counts: {
        teachingAssignments: taCount,
        schedules: scheduleCount,
        attendanceSessionsThisMonth: sessionThisMonth,
        assessments: assessmentCount,
        pendingScores,
        unreadNotifications,
      },
    };
  }

  async listTeachingAssignments(userId: string) {
    const teacher = await this.getTeacherForUser(userId);
    return this.prisma.teachingAssignment.findMany({
      where: { teacherId: teacher.id, deletedAt: null, isActive: true },
      include: { subject: true, classroom: { include: { competency: true } }, semester: { include: { academicYear: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async listSchedules(userId: string) {
    const teacher = await this.getTeacherForUser(userId);
    return this.prisma.schedule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        teachingAssignment: { teacherId: teacher.id, deletedAt: null, isActive: true },
      },
      include: {
        teachingAssignment: { include: { subject: true, classroom: { include: { competency: true } } } },
        room: true,
        lessonHour: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { lessonHour: { startTime: "asc" } }],
    });
  }

  async listAttendanceSessions(userId: string, limit = 20) {
    const teacher = await this.getTeacherForUser(userId);
    return this.prisma.attendanceSession.findMany({
      where: {
        deletedAt: null,
        schedule: { teachingAssignment: { teacherId: teacher.id, deletedAt: null } },
      },
      include: {
        schedule: {
          include: {
            teachingAssignment: { include: { subject: true, classroom: true } },
            lessonHour: true,
            room: true,
          },
        },
        _count: { select: { records: true } },
      },
      orderBy: { date: "desc" },
      take: limit,
    });
  }

  async listAssessments(userId: string) {
    const teacher = await this.getTeacherForUser(userId);
    return this.prisma.assessment.findMany({
      where: {
        deletedAt: null,
        teachingAssignment: { teacherId: teacher.id, deletedAt: null },
      },
      include: {
        teachingAssignment: { include: { subject: true, classroom: true } },
        _count: { select: { grades: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // Phase 10.5 — Teacher Dashboard
  async getDashboard(userId: string) {
    const teacher = await this.getTeacherForUser(userId);
    const now = new Date();
    const dayOfWeek = this.toDayOfWeek(now);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [teachingAssignments, todaySchedules, pendingAttendanceSessions, pendingAssessments, unreadNotifications, recentAnnouncements] =
      await Promise.all([
        this.prisma.teachingAssignment.findMany({
          where: { teacherId: teacher.id, deletedAt: null, isActive: true },
          select: {
            id: true,
            subjectId: true,
            classroomId: true,
            subject: { select: { name: true } },
            classroom: { select: { name: true } },
          },
        }),
        this.prisma.schedule.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            dayOfWeek,
            teachingAssignment: { teacherId: teacher.id, deletedAt: null, isActive: true },
          },
          include: {
            teachingAssignment: { include: { subject: true, classroom: { include: { competency: true } } } },
            room: true,
            lessonHour: true,
          },
          orderBy: { lessonHour: { startTime: "asc" } },
        }),
        this.prisma.attendanceSession.findMany({
          where: {
            deletedAt: null,
            date: { gte: startOfMonth, lte: endOfMonth },
            schedule: { teachingAssignment: { teacherId: teacher.id, deletedAt: null } },
            records: { none: {} },
          },
          include: {
            schedule: { include: { teachingAssignment: { include: { subject: true, classroom: true } } } },
            _count: { select: { records: true } },
          },
          orderBy: { date: "asc" },
          take: 10,
        }),
        this.prisma.assessment.findMany({
          where: {
            deletedAt: null,
            teachingAssignment: { teacherId: teacher.id, deletedAt: null },
          },
          include: {
            teachingAssignment: { include: { subject: true, classroom: true } },
            _count: { select: { grades: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        this.prisma.notification.count({ where: { userId, status: NotificationStatus.UNREAD } }),
        this.prisma.announcement.findMany({
          where: { status: AnnouncementStatus.PUBLISHED, deletedAt: null },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: { id: true, title: true, content: true, publishedAt: true },
        }),
      ]);

    const uniqueSubjects = new Set(teachingAssignments.map((ta) => ta.subjectId));
    const uniqueClassrooms = new Set(teachingAssignments.map((ta) => ta.classroomId));
    const pendingScoresCount = pendingAssessments.reduce((sum, a) => sum + (a._count.grades > 0 ? 0 : 1), 0);

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        email: teacher.email,
        photoUrl: teacher.photoUrl,
      },
      counts: {
        teachingAssignments: teachingAssignments.length,
        subjects: uniqueSubjects.size,
        classrooms: uniqueClassrooms.size,
        todaySchedules: todaySchedules.length,
        pendingAttendance: pendingAttendanceSessions.length,
        pendingGrades: pendingScoresCount,
        unreadNotifications,
      },
      todaySchedules,
      pendingAttendance: pendingAttendanceSessions,
      pendingAssessments: pendingAssessments.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        maxScore: a.maxScore,
        subject: a.teachingAssignment?.subject?.name ?? null,
        classroom: a.teachingAssignment?.classroom?.name ?? null,
        gradesCount: a._count.grades,
      })),
      recentAnnouncements,
    };
  }

  async getTodaySchedules(userId: string) {
    const teacher = await this.getTeacherForUser(userId);
    const dayOfWeek = this.toDayOfWeek(new Date());
    return this.prisma.schedule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        dayOfWeek,
        teachingAssignment: { teacherId: teacher.id, deletedAt: null, isActive: true },
      },
      include: {
        teachingAssignment: { include: { subject: true, classroom: { include: { competency: true } } } },
        room: true,
        lessonHour: true,
      },
      orderBy: { lessonHour: { startTime: "asc" } },
    });
  }

  async getPendingAttendance(userId: string) {
    const teacher = await this.getTeacherForUser(userId);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return this.prisma.attendanceSession.findMany({
      where: {
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
        schedule: { teachingAssignment: { teacherId: teacher.id, deletedAt: null } },
        records: { none: {} },
      },
      include: {
        schedule: { include: { teachingAssignment: { include: { subject: true, classroom: true } } } },
        _count: { select: { records: true } },
      },
      orderBy: { date: "asc" },
    });
  }

  async getPendingGrades(userId: string) {
    const teacher = await this.getTeacherForUser(userId);
    return this.prisma.assessment.findMany({
      where: {
        deletedAt: null,
        teachingAssignment: { teacherId: teacher.id, deletedAt: null },
      },
      include: {
        teachingAssignment: { include: { subject: true, classroom: true } },
        _count: { select: { grades: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAnnouncements(userId: string, limit = 30) {
    const teacher = await this.getTeacherForUser(userId);
    return this.prisma.announcement.findMany({
      take: limit,
      where: {
        deletedAt: null,
        status: { in: ["PUBLISHED", "ARCHIVED"] },
        audience: { in: ["ALL", "TEACHERS"] },
      },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDiscipline(userId: string, limit = 50) {
    const teacher = await this.getTeacherForUser(userId);
    const violations = await this.prisma.disciplineViolation.findMany({
      take: limit,
      where: {
        deletedAt: null,
        reportedById: teacher.userId ?? undefined,
      },
      include: {
        student: { select: { name: true, nis: true, classroom: { select: { name: true } } } },
        rule: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const achievements = await this.prisma.studentAchievement.findMany({
      take: limit,
      where: { deletedAt: null, awardedById: teacher.userId ?? undefined },
      include: {
        student: { select: { name: true, nis: true, classroom: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { violations, achievements };
  }

  async getRecentNotifications(userId: string, limit = 5) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  private toDayOfWeek(date: Date) {
    const map = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
    return map[date.getDay()];
  }
}
