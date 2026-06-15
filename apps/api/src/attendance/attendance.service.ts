import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { assertCanManageTeachingAssignment } from "../common/teacher-authorization";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { listQuerySchema } from "../master-data/base-master-data.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import { createSessionSchema, recordAttendanceSchema, updateAttendanceRecordSchema, updateSessionSchema } from "./attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
  ) {}

  async listSessions(query: unknown) {
    const params = parseWithSchema(listQuerySchema, query);
    const where: Record<string, unknown> = { deletedAt: null };
    const skip = (params.page - 1) * params.limit;

    if (params.search) {
      where.OR = [
        { schedule: { teachingAssignment: { subject: { name: { contains: params.search, mode: "insensitive" } } } } },
        { topic: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.attendanceSession.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { date: "desc" },
        include: {
          schedule: {
            include: {
              teachingAssignment: { include: { teacher: true, subject: true, classroom: true } },
              lessonHour: true,
            },
          },
          _count: { select: { records: true } },
        },
      }),
      this.prisma.attendanceSession.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findSessionById(id: string) {
    const item = await this.prisma.attendanceSession.findFirst({
      where: { id, deletedAt: null },
      include: {
        schedule: {
          include: {
            teachingAssignment: { include: { teacher: true, subject: true, classroom: true } },
            lessonHour: true,
            room: true,
          },
        },
        records: { include: { student: true }, orderBy: { student: { name: "asc" } } },
      },
    });
    if (!item) throw new NotFoundException("Attendance session not found");
    return item;
  }

  async createSession(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createSessionSchema, input);

    const schedule = await this.prisma.schedule.findFirst({
      where: { id: data.scheduleId, deletedAt: null },
      include: { teachingAssignment: true },
    });
    if (!schedule) throw new NotFoundException("Schedule not found");
    await assertCanManageTeachingAssignment(this.prisma, actor, schedule.teachingAssignment.teacherId, "attendance.approve");

    const existing = await this.prisma.attendanceSession.findFirst({
      where: { scheduleId: data.scheduleId, date: data.date },
    });
    if (existing) {
      throw new ConflictException("Attendance session already exists for this schedule and date");
    }

    const item = await this.prisma.attendanceSession.create({
      data: { scheduleId: data.scheduleId, date: data.date, topic: data.topic || null, notes: data.notes || null },
      include: { schedule: { include: { teachingAssignment: { include: { subject: true, classroom: true } }, lessonHour: true } } },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "attendance.session.create",
      entity: "attendance_session",
      entityId: item.id,
      metadata: { scheduleId: data.scheduleId, date: data.date.toISOString() },
    });
    return item;
  }

  async updateSession(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const session = await this.findSessionById(id);
    await assertCanManageTeachingAssignment(this.prisma, actor, session.schedule.teachingAssignment.teacherId, "attendance.approve");
    const data = parseWithSchema(updateSessionSchema, input);
    const item = await this.prisma.attendanceSession.update({ where: { id }, data });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "attendance.session.update",
      entity: "attendance_session",
      entityId: id,
      metadata: data,
    });
    return item;
  }

  async recordAttendance(sessionId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const session = await this.findSessionById(sessionId);
    await assertCanManageTeachingAssignment(this.prisma, actor, session.schedule.teachingAssignment.teacherId, "attendance.approve");
    const data = parseWithSchema(recordAttendanceSchema, input);

    // Only students enrolled in the session's classroom may be recorded.
    const classroomId = session.schedule.teachingAssignment.classroomId;
    if (classroomId) {
      const studentIds = [...new Set(data.records.map((record) => record.studentId))];
      const enrolledCount = await this.prisma.student.count({
        where: { id: { in: studentIds }, classroomId, deletedAt: null },
      });
      if (enrolledCount !== studentIds.length) {
        throw new BadRequestException("One or more students are not enrolled in this session's classroom");
      }
    }

    const results = [];

    for (const recordInput of data.records) {
      const existing = await this.prisma.attendanceRecord.findUnique({
        where: { sessionId_studentId: { sessionId, studentId: recordInput.studentId } },
      });
      if (existing) {
        const updated = await this.prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: { status: recordInput.status as any, note: recordInput.note || null },
        });
        results.push(updated);
      } else {
        const created = await this.prisma.attendanceRecord.create({
          data: { sessionId, studentId: recordInput.studentId, status: recordInput.status as any, note: recordInput.note || null },
        });
        results.push(created);
      }
    }

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "attendance.record",
      entity: "attendance_session",
      entityId: sessionId,
      metadata: { recordCount: data.records.length },
    });
    for (const record of results) {
      await this.notificationEvents.attendanceFlagged(
        record,
        { date: session.date, subject: session.schedule.teachingAssignment.subject.name },
        actor,
        meta,
      );
    }
    return results;
  }

  async getStudentSummary(studentId: string) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
    if (!student) throw new NotFoundException("Student not found");

    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        session: { include: { schedule: { include: { teachingAssignment: { include: { subject: true } }, lessonHour: true } } } },
      },
      orderBy: { session: { date: "desc" } },
    });

    const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, PERMIT: 0, SICK: 0 } as Record<string, number>;
    for (const r of records) {
      summary[r.status]++;
    }

    return { student, records, summary, total: records.length };
  }

  async getClassroomSummary(classroomId: string) {
    const classroom = await this.prisma.classroom.findFirst({ where: { id: classroomId, deletedAt: null } });
    if (!classroom) throw new NotFoundException("Classroom not found");

    const students = await this.prisma.student.findMany({
      where: { classroomId, deletedAt: null, status: "ACTIVE" as any },
      orderBy: { name: "asc" },
    });
    const studentSummaries = [];

    for (const student of students) {
      const records = await this.prisma.attendanceRecord.findMany({
        where: { studentId: student.id },
        include: { session: { include: { schedule: { include: { teachingAssignment: { include: { subject: true } } } } } } },
      });
      const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, PERMIT: 0, SICK: 0 } as Record<string, number>;
      for (const r of records) {
        summary[r.status]++;
      }
      studentSummaries.push({ student, summary, total: records.length });
    }

    return { classroom, students: studentSummaries };
  }
}
