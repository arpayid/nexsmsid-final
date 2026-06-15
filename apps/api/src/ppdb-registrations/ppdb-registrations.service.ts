import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createReadStream, existsSync } from "node:fs";
import type { Response } from "express";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { listQuerySchema } from "../master-data/base-master-data.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import { contentTypeForPpdbFilename, resolvePpdbAbsolutePath } from "../public-ppdb/ppdb-file.util";
import {
  createPpdbDocumentSchema,
  adminCreatePpdbRegistrationSchema,
  updatePpdbDocumentSchema,
  updatePpdbRegistrationSchema,
} from "./ppdb-registrations.dto";

@Injectable()
export class PpdbRegistrationsService {
  private readonly storagePath: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    this.storagePath = configService.get<string>("STORAGE_PATH") ?? "./storage";
  }

  async list(query: unknown) {
    const params = parseWithSchema(listQuerySchema, query);
    const where: Record<string, unknown> = {};
    const skip = (params.page - 1) * params.limit;

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { registrationNumber: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.ppdbRegistration.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { period: true, selectedDepartment: true, selectedCompetency: true, _count: { select: { documents: true } } },
      }),
      this.prisma.ppdbRegistration.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.ppdbRegistration.findFirst({
      where: { id },
      include: {
        period: true,
        selectedDepartment: true,
        selectedCompetency: true,
        verifiedBy: true,
        convertedStudent: true,
        documents: { orderBy: { createdAt: "asc" } },
        statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: true } },
      },
    });
    if (!item) throw new NotFoundException("Registration not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(adminCreatePpdbRegistrationSchema, input);

    const count = await this.prisma.ppdbRegistration.count();
    const now = new Date();
    const registrationNumber = `REG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(5, "0")}`;

    const registration = await this.prisma.ppdbRegistration.create({
      data: {
        registrationNumber,
        periodId: data.periodId,
        name: data.name,
        gender: data.gender,
        birthPlace: data.birthPlace || null,
        birthDate: data.birthDate || null,
        address: data.address || null,
        phone: data.phone,
        email: data.email || null,
        previousSchool: data.previousSchool || null,
        selectedDepartmentId: data.selectedDepartmentId || null,
        selectedCompetencyId: data.selectedCompetencyId || null,
        status: "SUBMITTED",
        selectionStatus: "PENDING",
      },
      include: { period: true },
    });

    await this.prisma.ppdbStatusHistory.create({
      data: { registrationId: registration.id, fromStatus: null, toStatus: "SUBMITTED", changedById: actor.id },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.registration.create",
      entity: "ppdb_registration",
      entityId: registration.id,
      metadata: { registrationNumber },
    });
    return registration;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (!["DRAFT", "SUBMITTED", "REVISION"].includes(existing.status))
      throw new BadRequestException("Cannot update registration in current status");

    const data = parseWithSchema(updatePpdbRegistrationSchema, input);
    const registration = await this.prisma.ppdbRegistration.update({ where: { id }, data, include: { period: true } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.registration.update",
      entity: "ppdb_registration",
      entityId: id,
      metadata: data,
    });
    return registration;
  }

  async changeStatus(id: string, newStatus: string, actor: AuthenticatedUser, meta: RequestMeta, extraData: Record<string, unknown> = {}) {
    const existing = await this.findById(id);
    const allowedTransitions: Record<string, string[]> = {
      SUBMITTED: ["VERIFIED", "REJECTED", "REVISION"],
      VERIFIED: ["ACCEPTED", "REJECTED", "REVISION"],
      REVISION: ["SUBMITTED", "REJECTED"],
      ACCEPTED: ["CONVERTED"],
      DRAFT: ["SUBMITTED"],
    };

    const allowed = allowedTransitions[existing.status];
    if (!allowed?.includes(newStatus)) throw new BadRequestException(`Cannot transition from ${existing.status} to ${newStatus}`);

    const registration = await this.prisma.ppdbRegistration.update({
      where: { id },
      data: {
        status: newStatus as never,
        ...extraData,
        verifiedAt: newStatus === "VERIFIED" ? new Date() : existing.verifiedAt,
        verifiedById: newStatus === "VERIFIED" ? actor.id : existing.verifiedById,
      },
      include: { period: true },
    });

    await this.prisma.ppdbStatusHistory.create({
      data: {
        registrationId: id,
        fromStatus: existing.status as never,
        toStatus: newStatus as never,
        changedById: actor.id,
        note: (extraData.note as string) || null,
      },
    });

    return registration;
  }

  async submit(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    return this.changeStatus(id, "SUBMITTED", actor, meta);
  }

  async verify(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const result = await this.changeStatus(id, "VERIFIED", actor, meta);
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.verify",
      entity: "ppdb_registration",
      entityId: id,
      metadata: {},
    });
    return result;
  }

  async requestRevision(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const parsed = input as Record<string, unknown>;
    const result = await this.changeStatus(id, "REVISION", actor, meta, { note: (parsed.note as string) || null });
    await this.notificationEvents.ppdbStatusChanged(result, actor, meta);
    return result;
  }

  async accept(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const parsed = input as Record<string, unknown>;
    const result = await this.changeStatus(id, "ACCEPTED", actor, meta, {
      note: (parsed.note as string) || null,
      selectionStatus: "PASSED",
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.accept",
      entity: "ppdb_registration",
      entityId: id,
      metadata: {},
    });
    await this.notificationEvents.ppdbStatusChanged(result, actor, meta);
    return result;
  }

  async reject(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const parsed = input as Record<string, unknown>;
    const result = await this.changeStatus(id, "REJECTED", actor, meta, {
      note: (parsed.note as string) || null,
      selectionStatus: "FAILED",
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.reject",
      entity: "ppdb_registration",
      entityId: id,
      metadata: {},
    });
    await this.notificationEvents.ppdbStatusChanged(result, actor, meta);
    return result;
  }

  async convertToStudent(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.convertedStudentId) throw new ConflictException("Registration has already been converted to a student");
    if (existing.status !== "ACCEPTED") throw new BadRequestException("Only ACCEPTED registrations can be converted to student");

    const nis = `PPDB-${existing.registrationNumber.slice(-8)}`;
    const student = await this.prisma.student.create({
      data: {
        nis,
        name: existing.name,
        gender: existing.gender,
        birthPlace: existing.birthPlace,
        birthDate: existing.birthDate,
        address: existing.address,
        phone: existing.phone,
        email: existing.email,
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
    });

    const registration = await this.prisma.ppdbRegistration.update({
      where: { id },
      data: { status: "CONVERTED", convertedStudentId: student.id },
      include: { period: true, convertedStudent: true },
    });

    await this.prisma.ppdbStatusHistory.create({
      data: { registrationId: id, fromStatus: "ACCEPTED", toStatus: "CONVERTED", changedById: actor.id },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.convert",
      entity: "ppdb_registration",
      entityId: id,
      metadata: { studentId: student.id, nis },
    });
    return registration;
  }

  async listDocuments(registrationId: string) {
    const registration = await this.findById(registrationId);
    return this.prisma.ppdbDocument.findMany({ where: { registrationId }, orderBy: { createdAt: "asc" } });
  }

  async createDocument(registrationId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(registrationId);
    const data = parseWithSchema(createPpdbDocumentSchema, input);
    const doc = await this.prisma.ppdbDocument.create({ data: { registrationId, name: data.name, fileUrl: data.fileUrl } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.document.create",
      entity: "ppdb_document",
      entityId: doc.id,
      metadata: { name: data.name },
    });
    return doc;
  }

  async updateDocument(documentId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(updatePpdbDocumentSchema, input);
    const doc = await this.prisma.ppdbDocument.update({
      where: { id: documentId },
      data: { ...(data.name !== undefined ? { name: data.name } : {}), ...(data.fileUrl !== undefined ? { fileUrl: data.fileUrl } : {}) },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.document.update",
      entity: "ppdb_document",
      entityId: documentId,
      metadata: { name: data.name },
    });
    return doc;
  }

  async verifyDocument(documentId: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const doc = await this.prisma.ppdbDocument.update({ where: { id: documentId }, data: { status: "VERIFIED" } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.document.verify",
      entity: "ppdb_document",
      entityId: documentId,
      metadata: {},
    });
    return doc;
  }

  async rejectDocument(documentId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const parsed = input as Record<string, unknown>;
    const doc = await this.prisma.ppdbDocument.update({
      where: { id: documentId },
      data: { status: "REJECTED", note: (parsed.note as string) || null },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "ppdb.document.reject",
      entity: "ppdb_document",
      entityId: documentId,
      metadata: {},
    });
    return doc;
  }

  async streamDocumentById(documentId: string, response: Response) {
    const document = await this.prisma.ppdbDocument.findUnique({ where: { id: documentId } });
    if (!document) throw new NotFoundException("Dokumen tidak ditemukan");

    const absolutePath = resolvePpdbAbsolutePath(this.storagePath, document.fileUrl);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException("File dokumen tidak ditemukan");
    }

    const filename = absolutePath.split(/[/\\]/).pop() ?? "document";
    response.setHeader("Content-Type", contentTypeForPpdbFilename(filename));
    response.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return new Promise<void>((resolve, reject) => {
      const stream = createReadStream(absolutePath);
      stream.on("error", reject);
      stream.on("end", () => resolve());
      stream.pipe(response);
    });
  }
}
