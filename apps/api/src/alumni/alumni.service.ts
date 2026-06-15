import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { alumniListQuerySchema, createAlumniSchema, updateAlumniSchema } from "./alumni.dto";

@Injectable()
export class AlumniService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(alumniListQuerySchema, query);
    const where: Record<string, unknown> = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.graduationYear) where.graduationYear = params.graduationYear;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { nis: { contains: params.search, mode: "insensitive" } },
        { currentCompany: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.alumni.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { student: true, _count: { select: { jobApplications: true, tracerStudies: true } } },
      }),
      this.prisma.alumni.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.alumni.findFirst({
      where: { id, deletedAt: null },
      include: { student: true, jobApplications: true, tracerStudies: true },
    });
    if (!item) throw new NotFoundException("Alumni not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createAlumniSchema, input);
    try {
      const item = await this.prisma.alumni.create({ data: this.cleanOptional(data) as never, include: { student: true } });
      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "alumni.create",
        entity: "alumni",
        entityId: item.id,
        metadata: { name: item.name },
      });
      return item;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updateAlumniSchema, input);
    try {
      const item = await this.prisma.alumni.update({ where: { id }, data: this.cleanOptional(data), include: { student: true } });
      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "alumni.update",
        entity: "alumni",
        entityId: id,
        metadata: data,
      });
      return item;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    await this.prisma.alumni.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.record({ ...meta, actorId: actor.id, action: "alumni.delete", entity: "alumni", entityId: id, metadata: {} });
    return { deleted: true, id };
  }

  async convertFromStudent(studentId: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existingAlumni = await this.prisma.alumni.findUnique({ where: { studentId } });
    if (existingAlumni && !existingAlumni.deletedAt) throw new ConflictException("Student has already been converted to alumni");
    const student = await this.prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
    if (!student) throw new NotFoundException("Student not found");

    const graduationYear = new Date().getFullYear();
    const [alumni] = await this.prisma.$transaction([
      existingAlumni
        ? this.prisma.alumni.update({
            where: { id: existingAlumni.id },
            data: {
              deletedAt: null,
              name: student.name,
              nis: student.nis,
              phone: student.phone,
              email: student.email,
              address: student.address,
              graduationYear,
              status: "ACTIVE",
            },
          })
        : this.prisma.alumni.create({
            data: {
              studentId,
              nis: student.nis,
              name: student.name,
              graduationYear,
              phone: student.phone,
              email: student.email,
              address: student.address,
              status: "ACTIVE",
            },
          }),
      this.prisma.student.update({ where: { id: studentId }, data: { status: "GRADUATED" } }),
    ]);

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "alumni.convert",
      entity: "alumni",
      entityId: alumni.id,
      metadata: { studentId },
    });
    return alumni;
  }

  private cleanOptional(data: Record<string, unknown>) {
    const cleaned = { ...data };
    for (const key of [
      "studentId",
      "nis",
      "phone",
      "email",
      "address",
      "currentCompany",
      "currentPosition",
      "university",
      "businessName",
    ]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    return cleaned;
  }

  private handleUniqueError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("Alumni already exists for this student or unique field");
    }
  }
}
