import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { listQuerySchema } from "../master-data/base-master-data.service";
import { createScheduleSchema, updateScheduleSchema } from "./schedules.dto";

type ScheduleDb = Pick<PrismaService, "teachingAssignment" | "schedule">;

@Injectable()
export class SchedulesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(listQuerySchema, query);
    const where: Record<string, unknown> = { deletedAt: null };
    const skip = (params.page - 1) * params.limit;

    if (params.search) {
      where.OR = [
        { teachingAssignment: { teacher: { name: { contains: params.search, mode: "insensitive" } } } },
        { teachingAssignment: { subject: { name: { contains: params.search, mode: "insensitive" } } } },
        { teachingAssignment: { classroom: { name: { contains: params.search, mode: "insensitive" } } } },
        { room: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: [{ dayOfWeek: "asc" }, { lessonHour: { order: "asc" } }],
        include: {
          teachingAssignment: { include: { teacher: true, subject: true, classroom: true } },
          room: true,
          lessonHour: true,
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.schedule.findFirst({
      where: { id, deletedAt: null },
      include: {
        teachingAssignment: { include: { teacher: true, subject: true, classroom: true } },
        room: true,
        lessonHour: true,
      },
    });
    if (!item) throw new NotFoundException("Schedule not found");
    return item;
  }

  async findByClassroom(classroomId: string) {
    return this.prisma.schedule.findMany({
      where: { deletedAt: null, teachingAssignment: { classroomId } },
      orderBy: [{ dayOfWeek: "asc" }, { lessonHour: { order: "asc" } }],
      include: { teachingAssignment: { include: { teacher: true, subject: true } }, room: true, lessonHour: true },
    });
  }

  async findByTeacher(teacherId: string) {
    return this.prisma.schedule.findMany({
      where: { deletedAt: null, teachingAssignment: { teacherId } },
      orderBy: [{ dayOfWeek: "asc" }, { lessonHour: { order: "asc" } }],
      include: { teachingAssignment: { include: { subject: true, classroom: true } }, room: true, lessonHour: true },
    });
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createScheduleSchema, input);
    const item = await this.prisma.$transaction(
      async (tx) => {
        await this.validateConflicts(tx, data, null);
        return tx.schedule.create({
          data,
          include: {
            teachingAssignment: { include: { teacher: true, subject: true, classroom: true } },
            room: true,
            lessonHour: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "schedule.create",
      entity: "schedule",
      entityId: item.id,
      metadata: {
        teachingAssignmentId: data.teachingAssignmentId,
        roomId: data.roomId,
        dayOfWeek: data.dayOfWeek,
        lessonHourId: data.lessonHourId,
      },
    });
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updateScheduleSchema, input);
    const item = await this.prisma.$transaction(
      async (tx) => {
        await this.validateConflicts(tx, data as any, id);
        return tx.schedule.update({
          where: { id },
          data,
          include: { teachingAssignment: { include: { teacher: true, subject: true, classroom: true } }, room: true, lessonHour: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "schedule.update",
      entity: "schedule",
      entityId: id,
      metadata: data,
    });
    return item;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const item = await this.prisma.schedule.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "schedule.delete",
      entity: "schedule",
      entityId: id,
      metadata: {},
    });
    return { id: item.id, deleted: true };
  }

  private async validateConflicts(
    db: ScheduleDb,
    data: { teachingAssignmentId: string; roomId: string; lessonHourId: string; dayOfWeek: string },
    excludeId: string | null,
  ) {
    const ta = await db.teachingAssignment.findUnique({
      where: { id: data.teachingAssignmentId },
      include: { teacher: true, classroom: true },
    });
    if (!ta) throw new NotFoundException("Teaching assignment not found");

    const whereExclude = excludeId ? { id: { not: excludeId } } : {};

    const teacherConflict = await db.schedule.findFirst({
      where: {
        deletedAt: null,
        ...whereExclude,
        dayOfWeek: data.dayOfWeek as any,
        lessonHourId: data.lessonHourId,
        teachingAssignment: { teacherId: ta.teacherId },
      },
      include: { teachingAssignment: { include: { teacher: true, subject: true } } },
    });
    if (teacherConflict) {
      throw new ConflictException(
        `Teacher ${ta.teacher.name} already has schedule for ${data.dayOfWeek} at this hour (${teacherConflict.teachingAssignment.subject.name})`,
      );
    }

    const classroomConflict = await db.schedule.findFirst({
      where: {
        deletedAt: null,
        ...whereExclude,
        dayOfWeek: data.dayOfWeek as any,
        lessonHourId: data.lessonHourId,
        teachingAssignment: { classroomId: ta.classroomId },
      },
      include: { teachingAssignment: { include: { classroom: true, subject: true } } },
    });
    if (classroomConflict) {
      throw new ConflictException(
        `Classroom ${ta.classroom.name} already has schedule for ${data.dayOfWeek} at this hour (${classroomConflict.teachingAssignment.subject.name})`,
      );
    }

    const roomConflict = await db.schedule.findFirst({
      where: { deletedAt: null, ...whereExclude, dayOfWeek: data.dayOfWeek as any, lessonHourId: data.lessonHourId, roomId: data.roomId },
      include: { room: true },
    });
    if (roomConflict) {
      throw new ConflictException(`Room ${roomConflict.room.name} already has schedule for ${data.dayOfWeek} at this hour`);
    }
  }
}
