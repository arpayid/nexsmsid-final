import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import {
  closeCounselingCaseSchema,
  counselingListQuerySchema,
  createCounselingCaseSchema,
  createCounselingNoteSchema,
  updateCounselingCaseSchema,
} from "./counseling.dto";

@Injectable()
export class CounselingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(counselingListQuerySchema, query);
    const where: Prisma.CounselingCaseWhereInput = { deletedAt: null };

    if (params.studentId) where.studentId = params.studentId;
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.category) where.category = params.category;
    if (params.counselorId) where.counselorId = params.counselorId;
    if (params.startDate || params.endDate) {
      where.openedAt = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { category: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { student: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.counselingCase.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: this.listInclude(),
      }),
      this.prisma.counselingCase.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.counselingCase.findFirst({
      where: { id, deletedAt: null },
      include: this.detailInclude(),
    });
    if (!item) throw new NotFoundException("Counseling case not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createCounselingCaseSchema, input);
    await this.assertStudentExists(data.studentId);
    if (data.counselorId) await this.assertUserExists(data.counselorId, "Counselor not found");

    const item = await this.prisma.counselingCase.create({
      data: {
        studentId: data.studentId,
        counselorId: data.counselorId ?? null,
        title: data.title,
        category: data.category,
        priority: data.priority,
        description: data.description,
        followUpDate: data.followUpDate ?? null,
        createdById: actor.id,
      },
      include: this.detailInclude(),
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "counseling.case.create",
      entity: "CounselingCase",
      entityId: item.id,
      metadata: { id: item.id, studentId: item.studentId, status: item.status, action: "create" },
    });

    if (item.followUpDate) {
      await this.notificationEvents.counselingFollowUp(item, actor, meta);
    }

    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    const data = parseWithSchema(updateCounselingCaseSchema, input);

    if (data.status === "CLOSED") {
      throw new BadRequestException("Use close endpoint to close a counseling case");
    }
    if (existing.status === "CLOSED" && data.status) {
      throw new BadRequestException("Use reopen endpoint to reopen a closed counseling case");
    }
    if (data.counselorId) await this.assertUserExists(data.counselorId, "Counselor not found");

    const updateData: Record<string, unknown> = { updatedById: actor.id };
    for (const key of ["title", "category", "priority", "status", "description"] as const) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.resolution !== undefined) updateData.resolution = data.resolution || null;
    if (data.followUpDate !== undefined) updateData.followUpDate = data.followUpDate ?? null;
    if (data.counselorId !== undefined) updateData.counselorId = data.counselorId ?? null;

    const item = await this.prisma.counselingCase.update({
      where: { id },
      data: updateData,
      include: this.detailInclude(),
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "counseling.case.update",
      entity: "CounselingCase",
      entityId: id,
      metadata: { id, studentId: item.studentId, status: item.status, action: "update" },
    });

    if (data.followUpDate && (!existing.followUpDate || existing.followUpDate.getTime() !== data.followUpDate.getTime())) {
      await this.notificationEvents.counselingFollowUp(item, actor, meta);
    }

    return item;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    await this.prisma.counselingCase.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actor.id } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "counseling.case.delete",
      entity: "CounselingCase",
      entityId: id,
      metadata: { id, studentId: existing.studentId, status: existing.status, action: "delete" },
    });
    return { deleted: true, id };
  }

  async close(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status === "CLOSED") throw new BadRequestException("Counseling case is already closed");
    const data = parseWithSchema(closeCounselingCaseSchema, input ?? {});
    const item = await this.prisma.counselingCase.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date(), resolution: data.resolution || existing.resolution, updatedById: actor.id },
      include: this.detailInclude(),
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "counseling.case.close",
      entity: "CounselingCase",
      entityId: id,
      metadata: { id, studentId: item.studentId, status: item.status, action: "close" },
    });
    return item;
  }

  async reopen(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "CLOSED") throw new BadRequestException("Only CLOSED counseling cases can be reopened");
    const item = await this.prisma.counselingCase.update({
      where: { id },
      data: { status: "OPEN", closedAt: null, updatedById: actor.id },
      include: this.detailInclude(),
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "counseling.case.reopen",
      entity: "CounselingCase",
      entityId: id,
      metadata: { id, studentId: item.studentId, status: item.status, action: "reopen" },
    });
    return item;
  }

  async listNotes(caseId: string) {
    await this.findById(caseId);
    return this.prisma.counselingNote.findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, email: true, name: true } } },
    });
  }

  async createNote(caseId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const counselingCase = await this.findById(caseId);
    const data = parseWithSchema(createCounselingNoteSchema, input);
    if (["PRIVATE", "COUNSELOR_ONLY"].includes(data.visibility) && !hasPermission(actor, "counseling.view")) {
      throw new BadRequestException("Private counseling notes require counseling.view permission");
    }

    const note = await this.prisma.counselingNote.create({
      data: { caseId, note: data.note, visibility: data.visibility, createdById: actor.id },
      include: { createdBy: { select: { id: true, email: true, name: true } } },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "counseling.note.create",
      entity: "CounselingNote",
      entityId: note.id,
      metadata: { id: note.id, caseId, studentId: counselingCase.studentId, visibility: note.visibility, action: "create" },
    });

    return note;
  }

  private async assertStudentExists(studentId: string) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, deletedAt: null }, select: { id: true } });
    if (!student) throw new BadRequestException("Student not found");
  }

  private async assertUserExists(userId: string, message: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null, status: "ACTIVE" }, select: { id: true } });
    if (!user) throw new BadRequestException(message);
  }

  private listInclude() {
    return {
      _count: { select: { notes: true } },
      counselor: { select: { id: true, email: true, name: true } },
      createdBy: { select: { id: true, email: true, name: true } },
      student: { select: { id: true, name: true, nis: true, nisn: true, classroom: { select: { id: true, code: true, name: true } } } },
    };
  }

  private detailInclude() {
    return {
      ...this.listInclude(),
      notes: {
        orderBy: { createdAt: "desc" as const },
        include: { createdBy: { select: { id: true, email: true, name: true } } },
      },
      updatedBy: { select: { id: true, email: true, name: true } },
    };
  }
}

function hasPermission(user: AuthenticatedUser, permission: string) {
  return user.permissions.includes("*") || user.permissions.includes(permission);
}
