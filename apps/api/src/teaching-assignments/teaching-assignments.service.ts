import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { listQuerySchema } from "../master-data/base-master-data.service";
import { PrismaService } from "../database/prisma.service";
import { createTeachingAssignmentSchema, updateTeachingAssignmentSchema } from "./teaching-assignments.dto";

@Injectable()
export class TeachingAssignmentsService {
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
        { teacher: { name: { contains: params.search, mode: "insensitive" } } },
        { subject: { name: { contains: params.search, mode: "insensitive" } } },
        { classroom: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.teachingAssignment.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          teacher: true,
          subject: true,
          classroom: { include: { competency: true } },
          academicYear: true,
          semester: true,
        },
      }),
      this.prisma.teachingAssignment.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.teachingAssignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        teacher: true,
        subject: true,
        classroom: { include: { competency: true } },
        academicYear: true,
        semester: true,
      },
    });

    if (!item) throw new NotFoundException("Teaching assignment not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createTeachingAssignmentSchema, input);

    try {
      const item = await this.prisma.teachingAssignment.create({
        data,
        include: { teacher: true, subject: true, classroom: true, academicYear: true, semester: true },
      });

      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "teaching_assignment.create",
        entity: "teaching_assignment",
        entityId: item.id,
        metadata: { teacherId: data.teacherId, subjectId: data.subjectId, classroomId: data.classroomId },
      });
      return item;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Teaching assignment already exists for this teacher, subject, classroom, and semester");
      }
      throw error;
    }
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updateTeachingAssignmentSchema, input);

    try {
      const item = await this.prisma.teachingAssignment.update({
        where: { id },
        data,
        include: { teacher: true, subject: true, classroom: true, academicYear: true, semester: true },
      });
      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "teaching_assignment.update",
        entity: "teaching_assignment",
        entityId: id,
        metadata: data,
      });
      return item;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Teaching assignment already exists for this teacher, subject, classroom, and semester");
      }
      throw error;
    }
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    const item = await this.prisma.teachingAssignment.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "teaching_assignment.delete",
      entity: "teaching_assignment",
      entityId: id,
      metadata: { teacherId: existing.teacherId, subjectId: existing.subjectId },
    });
    return { id: item.id, deleted: true };
  }
}
