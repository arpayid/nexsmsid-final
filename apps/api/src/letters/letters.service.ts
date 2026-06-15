import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { mkdirSync } from "fs";
import { access } from "fs/promises";
import { writeFile } from "fs/promises";
import { join, resolve, sep } from "path";

import type { Response } from "express";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { validatePpdbDocumentMagicBytes } from "../common/upload";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import { LetterNumberService, normalizeCategory } from "./letter-number.service";
import { LetterPdfService } from "./letter-pdf.service";
import {
  createLetterSchema,
  createLetterTemplateSchema,
  listLettersSchema,
  listLetterTemplatesSchema,
  numberPreviewSchema,
  rejectLetterSchema,
  updateLetterSchema,
  updateLetterTemplateSchema,
} from "./letters.dto";

const editableStatuses = ["DRAFT"];
const softDeletableStatuses = ["DRAFT", "REJECTED", "CANCELLED"];
const LETTER_ATTACHMENT_PREFIX = "letters";

@Injectable()
export class LettersService {
  private readonly storagePath: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
    @Inject(LetterNumberService) private readonly letterNumber: LetterNumberService,
    @Inject(LetterPdfService) private readonly letterPdf: LetterPdfService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    this.storagePath = configService.get<string>("STORAGE_PATH") ?? "./storage";
  }

  async listTemplates(query: unknown) {
    const params = parseWithSchema(listLetterTemplatesSchema, query);
    const where: Prisma.LetterTemplateWhereInput = { deletedAt: null };
    if (params.category) where.category = normalizeCategory(params.category);
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: "insensitive" } },
        { name: { contains: params.search, mode: "insensitive" } },
        { category: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.letterTemplate.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: [{ category: "asc" }, { code: "asc" }],
        include: this.templateInclude(),
      }),
      this.prisma.letterTemplate.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async getTemplate(id: string) {
    const item = await this.prisma.letterTemplate.findFirst({ where: { id, deletedAt: null }, include: this.templateInclude() });
    if (!item) throw new NotFoundException("Letter template not found");
    return item;
  }

  async createTemplate(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createLetterTemplateSchema, input);
    const item = await this.prisma.letterTemplate.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name,
        description: data.description || null,
        category: normalizeCategory(data.category),
        status: data.status,
        subjectTemplate: data.subjectTemplate,
        bodyTemplate: data.bodyTemplate,
        variables: data.variables === undefined ? undefined : (data.variables as Prisma.InputJsonValue),
        requiresApproval: data.requiresApproval,
        createdById: actor.id,
      },
      include: this.templateInclude(),
    });
    await this.recordAudit("letters.template.create", "LetterTemplate", item.id, actor, meta, {
      templateId: item.id,
      category: item.category,
      code: item.code,
    });
    return item;
  }

  async updateTemplate(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.getTemplate(id);
    const data = parseWithSchema(updateLetterTemplateSchema, input);
    const updateData: Prisma.LetterTemplateUpdateInput = { updatedBy: { connect: { id: actor.id } } };
    if (data.code !== undefined) updateData.code = data.code.trim().toUpperCase();
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.category !== undefined) updateData.category = normalizeCategory(data.category);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.subjectTemplate !== undefined) updateData.subjectTemplate = data.subjectTemplate;
    if (data.bodyTemplate !== undefined) updateData.bodyTemplate = data.bodyTemplate;
    if (data.variables !== undefined) updateData.variables = data.variables as Prisma.InputJsonValue;
    if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval;
    const item = await this.prisma.letterTemplate.update({ where: { id }, data: updateData, include: this.templateInclude() });
    await this.recordAudit("letters.template.update", "LetterTemplate", item.id, actor, meta, {
      templateId: item.id,
      category: item.category,
      code: item.code,
    });
    return item;
  }

  async deleteTemplate(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getTemplate(id);
    const item = await this.prisma.letterTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: actor.id },
      include: this.templateInclude(),
    });
    await this.recordAudit("letters.template.delete", "LetterTemplate", id, actor, meta, {
      templateId: id,
      category: existing.category,
      code: existing.code,
    });
    return { deleted: true, item };
  }

  async listLetters(query: unknown) {
    const params = parseWithSchema(listLettersSchema, query);
    const where: Prisma.LetterWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.direction) where.direction = params.direction;
    if (params.priority) where.priority = params.priority;
    if (params.category) where.category = normalizeCategory(params.category);
    if (params.recipientType) where.recipientType = params.recipientType;
    if (params.studentId) where.studentId = params.studentId;
    if (params.guardianId) where.guardianId = params.guardianId;
    if (params.teacherId) where.teacherId = params.teacherId;
    if (params.staffId) where.staffId = params.staffId;
    if (params.createdById) where.createdById = params.createdById;
    if (params.startDate || params.endDate) {
      where.createdAt = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }
    if (params.search) {
      where.OR = [
        { letterNumber: { contains: params.search, mode: "insensitive" } },
        { subject: { contains: params.search, mode: "insensitive" } },
        { recipientName: { contains: params.search, mode: "insensitive" } },
        { category: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.letter.findMany({ where, skip, take: params.limit, orderBy: { createdAt: "desc" }, include: this.letterInclude() }),
      this.prisma.letter.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async getLetter(id: string) {
    const item = await this.prisma.letter.findFirst({ where: { id, deletedAt: null }, include: this.letterInclude() });
    if (!item) throw new NotFoundException("Letter not found");
    return item;
  }

  async createLetter(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createLetterSchema, input);
    await this.assertLetterReferences(data);
    const item = await this.prisma.letter.create({
      data: {
        templateId: data.templateId ?? null,
        subject: data.subject,
        body: data.body,
        direction: data.direction,
        priority: data.priority,
        category: normalizeCategory(data.category),
        recipientType: data.recipientType,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail ?? null,
        recipientAddress: data.recipientAddress ?? null,
        studentId: data.studentId ?? null,
        guardianId: data.guardianId ?? null,
        teacherId: data.teacherId ?? null,
        staffId: data.staffId ?? null,
        relatedCounselingCaseId: data.relatedCounselingCaseId ?? null,
        relatedDisciplineViolationId: data.relatedDisciplineViolationId ?? null,
        createdById: actor.id,
      },
      include: this.letterInclude(),
    });
    await this.recordAudit("letters.create", "Letter", item.id, actor, meta, this.letterAuditMetadata(item));
    return item;
  }

  async updateLetter(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getLetter(id);
    if (!editableStatuses.includes(existing.status)) throw new BadRequestException("Only DRAFT letters can be updated");
    const data = parseWithSchema(updateLetterSchema, input);
    await this.assertLetterReferences(data);
    const updateData: Prisma.LetterUpdateInput = { updatedBy: { connect: { id: actor.id } } };
    if (data.templateId !== undefined) updateData.template = data.templateId ? { connect: { id: data.templateId } } : { disconnect: true };
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.direction !== undefined) updateData.direction = data.direction;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = normalizeCategory(data.category);
    if (data.recipientType !== undefined) updateData.recipientType = data.recipientType;
    if (data.recipientName !== undefined) updateData.recipientName = data.recipientName;
    if (data.recipientEmail !== undefined) updateData.recipientEmail = data.recipientEmail ?? null;
    if (data.recipientAddress !== undefined) updateData.recipientAddress = data.recipientAddress ?? null;
    if (data.studentId !== undefined) updateData.student = data.studentId ? { connect: { id: data.studentId } } : { disconnect: true };
    if (data.guardianId !== undefined) updateData.guardian = data.guardianId ? { connect: { id: data.guardianId } } : { disconnect: true };
    if (data.teacherId !== undefined) updateData.teacher = data.teacherId ? { connect: { id: data.teacherId } } : { disconnect: true };
    if (data.staffId !== undefined) updateData.staff = data.staffId ? { connect: { id: data.staffId } } : { disconnect: true };
    if (data.relatedCounselingCaseId !== undefined)
      updateData.relatedCounselingCase = data.relatedCounselingCaseId
        ? { connect: { id: data.relatedCounselingCaseId } }
        : { disconnect: true };
    if (data.relatedDisciplineViolationId !== undefined)
      updateData.relatedDisciplineViolation = data.relatedDisciplineViolationId
        ? { connect: { id: data.relatedDisciplineViolationId } }
        : { disconnect: true };
    const item = await this.prisma.letter.update({ where: { id }, data: updateData, include: this.letterInclude() });
    await this.recordAudit("letters.update", "Letter", item.id, actor, meta, this.letterAuditMetadata(item));
    return item;
  }

  async deleteLetter(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getLetter(id);
    if (!softDeletableStatuses.includes(existing.status))
      throw new BadRequestException("Only DRAFT, REJECTED, or CANCELLED letters can be deleted");
    const item = await this.prisma.letter.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: actor.id },
      include: this.letterInclude(),
    });
    await this.recordAudit("letters.delete", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    return { deleted: true, item };
  }

  async submitLetter(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getLetter(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT letters can be submitted");
    const approvers = await this.findApproverUsers();
    const item = await this.prisma.$transaction(async (tx) => {
      await tx.letterApproval.deleteMany({ where: { letterId: id, status: "PENDING" } });
      for (const approver of approvers) {
        await tx.letterApproval.create({ data: { letterId: id, approverId: approver.id } });
      }
      return tx.letter.update({
        where: { id },
        data: { status: "SUBMITTED", submittedAt: new Date(), updatedById: actor.id },
        include: this.letterInclude(),
      });
    });
    await this.recordAudit("letters.submit", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    await this.notificationEvents.letterSubmitted(item, actor, meta);
    return item;
  }

  async approveLetter(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getLetter(id);
    if (existing.status !== "SUBMITTED") throw new BadRequestException("Only SUBMITTED letters can be approved");
    const item = await this.prisma.$transaction(async (tx) => {
      await this.markApproval(tx, id, actor.id, "APPROVED");
      return tx.letter.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: actor.id,
          rejectedAt: null,
          rejectedById: null,
          rejectionReason: null,
          updatedById: actor.id,
        },
        include: this.letterInclude(),
      });
    });
    await this.recordAudit("letters.approve", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    await this.notificationEvents.letterApproved(item, actor, meta);
    return item;
  }

  async rejectLetter(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getLetter(id);
    if (existing.status !== "SUBMITTED") throw new BadRequestException("Only SUBMITTED letters can be rejected");
    const data = parseWithSchema(rejectLetterSchema, input);
    const item = await this.prisma.$transaction(async (tx) => {
      await this.markApproval(tx, id, actor.id, "REJECTED", data.rejectionReason);
      return tx.letter.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedById: actor.id,
          rejectionReason: data.rejectionReason,
          updatedById: actor.id,
        },
        include: this.letterInclude(),
      });
    });
    await this.recordAudit("letters.reject", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    await this.notificationEvents.letterRejected(item, actor, meta);
    return item;
  }

  async issueLetter(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const item = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.letter.findFirst({ where: { id, deletedAt: null }, include: { template: true } });
      if (!existing) throw new NotFoundException("Letter not found");
      if (existing.status === "ISSUED") throw new BadRequestException("Letter is already issued");
      if (["ARCHIVED", "CANCELLED"].includes(existing.status))
        throw new BadRequestException("Archived or cancelled letters cannot be issued");
      if (existing.template?.requiresApproval && existing.status !== "APPROVED")
        throw new BadRequestException("This letter requires approval before issue");
      if (!existing.template?.requiresApproval && !["DRAFT", "SUBMITTED", "APPROVED"].includes(existing.status))
        throw new BadRequestException("Letter cannot be issued from current status");
      const letterNumber = existing.letterNumber ?? (await this.letterNumber.next(existing.category, new Date(), tx));
      return tx.letter.update({
        where: { id },
        data: { letterNumber, status: "ISSUED", issuedAt: new Date(), updatedById: actor.id },
        include: this.letterInclude(),
      });
    });
    await this.recordAudit("letters.issue", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    await this.notificationEvents.letterIssued(item, actor, meta);
    return item;
  }

  async archiveLetter(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getLetter(id);
    if (existing.status !== "ISSUED") throw new BadRequestException("Only ISSUED letters can be archived");
    const item = await this.prisma.letter.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: new Date(), updatedById: actor.id },
      include: this.letterInclude(),
    });
    await this.recordAudit("letters.archive", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    return item;
  }

  async cancelLetter(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getLetter(id);
    if (["ARCHIVED", "CANCELLED"].includes(existing.status))
      throw new BadRequestException("Archived or cancelled letters cannot be cancelled");
    const item = await this.prisma.letter.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date(), updatedById: actor.id },
      include: this.letterInclude(),
    });
    await this.recordAudit("letters.cancel", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    await this.notificationEvents.letterCancelled(item, actor, meta);
    return item;
  }

  async reopenLetter(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getLetter(id);
    if (existing.status === "CANCELLED" && !actor.roles.includes("super-admin"))
      throw new BadRequestException("Only Super Admin can reopen cancelled letters");
    if (!actor.roles.includes("super-admin") && existing.status !== "REJECTED")
      throw new BadRequestException("Only REJECTED letters can be reopened");
    if (!["REJECTED", "CANCELLED"].includes(existing.status))
      throw new BadRequestException("Only REJECTED or CANCELLED letters can be reopened");
    const item = await this.prisma.letter.update({
      where: { id },
      data: {
        status: "DRAFT",
        submittedAt: null,
        approvedAt: null,
        approvedById: null,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
        cancelledAt: null,
        updatedById: actor.id,
      },
      include: this.letterInclude(),
    });
    await this.recordAudit("letters.reopen", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    return item;
  }

  async generateNumber(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const item = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.letter.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new NotFoundException("Letter not found");
      if (existing.letterNumber) return tx.letter.findUniqueOrThrow({ where: { id }, include: this.letterInclude() });
      if (existing.status === "CANCELLED") throw new BadRequestException("Cancelled letters cannot receive a letter number");
      const letterNumber = await this.letterNumber.next(existing.category, new Date(), tx);
      return tx.letter.update({ where: { id }, data: { letterNumber, updatedById: actor.id }, include: this.letterInclude() });
    });
    await this.recordAudit("letters.number.generate", "Letter", id, actor, meta, this.letterAuditMetadata(item));
    return item;
  }

  async numberPreview(query: unknown) {
    const params = parseWithSchema(numberPreviewSchema, query);
    const date = params.date ?? new Date();
    return { letterNumber: await this.letterNumber.preview(params.category, date), category: normalizeCategory(params.category), date };
  }

  async summary() {
    const [total, statusRows, recentIssued] = await Promise.all([
      this.prisma.letter.count({ where: { deletedAt: null } }),
      this.prisma.letter.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
      this.prisma.letter.findMany({
        where: { deletedAt: null, status: "ISSUED" },
        take: 5,
        orderBy: { issuedAt: "desc" },
        include: this.letterInclude(),
      }),
    ]);
    const byStatus = Object.fromEntries(statusRows.map((row) => [row.status.toLowerCase(), row._count]));
    return { total, byStatus, recentIssued };
  }

  async printLetter(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const letter = await this.getLetter(id);
    const result = await this.letterPdf.build(letter);
    await this.recordAudit("letters.print", "Letter", id, actor, meta, this.letterAuditMetadata(letter));
    return result;
  }

  async uploadAttachment(letterId: string, file: Express.Multer.File, actor: AuthenticatedUser, meta: RequestMeta) {
    const letter = await this.prisma.letter.findFirst({ where: { id: letterId, deletedAt: null } });
    if (!letter) throw new NotFoundException("Letter not found");
    if (!file?.buffer?.length) throw new BadRequestException("File is required");

    validatePpdbDocumentMagicBytes(file.buffer, file.originalname);

    const safeName = (file.originalname ?? "attachment.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${randomUUID()}-${safeName}`;
    const relativePath = join(LETTER_ATTACHMENT_PREFIX, letterId, storedName).replace(/\\/g, "/");
    const absoluteDir = join(this.storagePath, LETTER_ATTACHMENT_PREFIX, letterId);
    mkdirSync(absoluteDir, { recursive: true });
    await writeFile(join(absoluteDir, storedName), file.buffer);

    const attachment = await this.prisma.letterAttachment.create({
      data: {
        letterId,
        filename: storedName,
        originalName: file.originalname ?? safeName,
        mimeType: file.mimetype ?? "application/octet-stream",
        size: file.size,
        path: relativePath,
        uploadedById: actor.id,
      },
    });

    await this.recordAudit("letter.attachment.upload", "letter_attachment", attachment.id, actor, meta, {
      letterId,
      filename: attachment.originalName,
    } as Prisma.InputJsonValue);

    return attachment;
  }

  async streamAttachment(letterId: string, attachmentId: string, actor: AuthenticatedUser, meta: RequestMeta, response: Response) {
    await this.getLetter(letterId);

    const attachment = await this.prisma.letterAttachment.findFirst({
      where: { id: attachmentId, letterId },
    });
    if (!attachment) throw new NotFoundException("Attachment not found");

    const absolutePath = resolve(this.storagePath, attachment.path);
    const allowedRoot = resolve(this.storagePath, LETTER_ATTACHMENT_PREFIX);
    if (!absolutePath.startsWith(`${allowedRoot}${sep}`)) {
      throw new BadRequestException("Invalid attachment path");
    }

    try {
      await access(absolutePath);
    } catch {
      throw new NotFoundException("Attachment file not found");
    }

    await this.recordAudit("letter.attachment.download", "letter_attachment", attachment.id, actor, meta, {
      letterId,
      filename: attachment.originalName,
    } as Prisma.InputJsonValue);

    response.setHeader("Content-Type", attachment.mimeType);
    response.setHeader("Content-Disposition", `inline; filename="${attachment.originalName.replace(/"/g, "")}"`);
    createReadStream(absolutePath).pipe(response);
  }

  private async markApproval(
    tx: Prisma.TransactionClient,
    letterId: string,
    approverId: string,
    status: "APPROVED" | "REJECTED",
    note?: string,
  ) {
    const existing = await tx.letterApproval.findFirst({ where: { letterId, approverId, status: "PENDING" } });
    const data =
      status === "APPROVED"
        ? { status, note: note ?? null, approvedAt: new Date(), rejectedAt: null }
        : { status, note: note ?? null, rejectedAt: new Date(), approvedAt: null };
    if (existing) {
      await tx.letterApproval.update({ where: { id: existing.id }, data });
      return;
    }
    await tx.letterApproval.create({ data: { letterId, approverId, ...data } });
  }

  private async assertLetterReferences(data: {
    templateId?: string;
    studentId?: string;
    guardianId?: string;
    teacherId?: string;
    staffId?: string;
    relatedCounselingCaseId?: string;
    relatedDisciplineViolationId?: string;
    recipientType?: string;
  }) {
    const checks: Array<Promise<unknown>> = [];
    if (data.templateId)
      checks.push(
        this.assertExists(
          this.prisma.letterTemplate.count({ where: { id: data.templateId, deletedAt: null } }),
          "Letter template not found",
        ),
      );
    if (data.studentId)
      checks.push(this.assertExists(this.prisma.student.count({ where: { id: data.studentId, deletedAt: null } }), "Student not found"));
    if (data.guardianId)
      checks.push(this.assertExists(this.prisma.guardian.count({ where: { id: data.guardianId } }), "Guardian not found"));
    if (data.teacherId)
      checks.push(this.assertExists(this.prisma.teacher.count({ where: { id: data.teacherId, deletedAt: null } }), "Teacher not found"));
    if (data.staffId)
      checks.push(this.assertExists(this.prisma.staff.count({ where: { id: data.staffId, deletedAt: null } }), "Staff not found"));
    if (data.relatedCounselingCaseId)
      checks.push(
        this.assertExists(
          this.prisma.counselingCase.count({ where: { id: data.relatedCounselingCaseId, deletedAt: null } }),
          "Counseling case not found",
        ),
      );
    if (data.relatedDisciplineViolationId)
      checks.push(
        this.assertExists(
          this.prisma.disciplineViolation.count({ where: { id: data.relatedDisciplineViolationId, deletedAt: null } }),
          "Discipline violation not found",
        ),
      );
    await Promise.all(checks);
    if (data.recipientType === "STUDENT" && !data.studentId) throw new BadRequestException("studentId is required for STUDENT recipients");
    if (data.recipientType === "GUARDIAN" && !data.guardianId)
      throw new BadRequestException("guardianId is required for GUARDIAN recipients");
    if (data.recipientType === "TEACHER" && !data.teacherId) throw new BadRequestException("teacherId is required for TEACHER recipients");
    if (data.recipientType === "STAFF" && !data.staffId) throw new BadRequestException("staffId is required for STAFF recipients");
  }

  private async assertExists(countPromise: Promise<number>, message: string) {
    const count = await countPromise;
    if (count === 0) throw new BadRequestException(message);
  }

  private async findApproverUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE", roles: { some: { role: { slug: "approver", isActive: true } } } },
      select: { id: true },
    });
  }

  private templateInclude() {
    return {
      createdBy: { select: this.userSelect() },
      updatedBy: { select: this.userSelect() },
    };
  }

  private letterInclude() {
    return {
      template: { select: { id: true, code: true, name: true, category: true, requiresApproval: true } },
      student: { select: { id: true, nis: true, name: true, userId: true } },
      guardian: { select: { id: true, name: true, relation: true, userId: true } },
      teacher: { select: { id: true, name: true, nip: true, userId: true } },
      staff: { select: { id: true, name: true, position: true } },
      createdBy: { select: this.userSelect() },
      updatedBy: { select: this.userSelect() },
      approvedBy: { select: this.userSelect() },
      rejectedBy: { select: this.userSelect() },
      approvals: { orderBy: { createdAt: "desc" as const }, include: { approver: { select: this.userSelect() } } },
      attachments: { orderBy: { createdAt: "desc" as const } },
    };
  }

  private userSelect() {
    return { id: true, email: true, name: true };
  }

  private letterAuditMetadata(letter: {
    id: string;
    letterNumber: string | null;
    status: string;
    category: string;
    recipientType: string;
    createdById: string;
    approvedById?: string | null;
  }) {
    return {
      letterId: letter.id,
      letterNumber: letter.letterNumber,
      status: letter.status,
      category: letter.category,
      recipientType: letter.recipientType,
      createdById: letter.createdById,
      approvedById: letter.approvedById ?? null,
    };
  }

  private async recordAudit(
    action: string,
    entity: string,
    entityId: string,
    actor: AuthenticatedUser,
    meta: RequestMeta,
    metadata: Prisma.InputJsonValue,
  ) {
    await this.audit.record({ ...meta, actorId: actor.id, action, entity, entityId, metadata });
  }
}
