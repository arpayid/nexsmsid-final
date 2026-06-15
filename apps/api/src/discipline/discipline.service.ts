import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import { PdfService } from "../pdf/pdf.service";
import { PdfDocumentResult } from "../pdf/pdf.types";
import {
  createAchievementSchema,
  createDisciplineRuleSchema,
  createViolationSchema,
  disciplineListQuerySchema,
  updateAchievementSchema,
  updateDisciplineRuleSchema,
  updateViolationSchema,
} from "./discipline.dto";

const MAX_FUTURE_INCIDENT_DAYS = 1;

@Injectable()
export class DisciplineService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
    @Inject(PdfService) private readonly pdfService: PdfService,
  ) {}

  async listRules(query: unknown) {
    const params = parseWithSchema(disciplineListQuerySchema, query);
    const where: Prisma.DisciplineRuleWhereInput = {};
    if (params.severity) where.severity = params.severity;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: "insensitive" } },
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.disciplineRule.findMany({ where, skip, take: params.limit, orderBy: [{ isActive: "desc" }, { code: "asc" }] }),
      this.prisma.disciplineRule.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async getRule(id: string) {
    const rule = await this.prisma.disciplineRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException("Discipline rule not found");
    return rule;
  }

  async createRule(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createDisciplineRuleSchema, input);
    const item = await this.prisma.disciplineRule.create({
      data: { ...data, code: data.code.trim().toUpperCase(), description: data.description || null },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.rule.create",
      entity: "DisciplineRule",
      entityId: item.id,
      metadata: { id: item.id, code: item.code, point: item.point, severity: item.severity, action: "create" },
    });
    return item;
  }

  async updateRule(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.getRule(id);
    const data = parseWithSchema(updateDisciplineRuleSchema, input);
    const updateData: Record<string, unknown> = { ...data };
    if (data.code) updateData.code = data.code.trim().toUpperCase();
    if (data.description !== undefined) updateData.description = data.description || null;
    const item = await this.prisma.disciplineRule.update({ where: { id }, data: updateData });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.rule.update",
      entity: "DisciplineRule",
      entityId: id,
      metadata: { id, code: item.code, point: item.point, severity: item.severity, action: "update" },
    });
    return item;
  }

  async deleteRule(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const rule = await this.getRule(id);
    const used = await this.prisma.disciplineViolation.count({ where: { ruleId: id } });
    if (used > 0) {
      await this.prisma.disciplineRule.update({ where: { id }, data: { isActive: false } });
    } else {
      await this.prisma.disciplineRule.delete({ where: { id } });
    }
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.rule.delete",
      entity: "DisciplineRule",
      entityId: id,
      metadata: { id, code: rule.code, action: used > 0 ? "deactivate" : "delete" },
    });
    return { deleted: true, id };
  }

  async listViolations(query: unknown) {
    const params = parseWithSchema(disciplineListQuerySchema, query);
    const where: Prisma.DisciplineViolationWhereInput = { deletedAt: null };
    if (params.studentId) where.studentId = params.studentId;
    if (params.ruleId) where.ruleId = params.ruleId;
    if (params.status) where.status = params.status;
    if (params.classroomId) where.student = { classroomId: params.classroomId };
    if (params.severity) where.rule = { severity: params.severity };
    if (params.startDate || params.endDate) {
      where.incidentDate = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }
    if (params.search) {
      where.OR = [
        { description: { contains: params.search, mode: "insensitive" } },
        { student: { name: { contains: params.search, mode: "insensitive" } } },
        { rule: { name: { contains: params.search, mode: "insensitive" } } },
        { rule: { code: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.disciplineViolation.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { incidentDate: "desc" },
        include: this.violationInclude(),
      }),
      this.prisma.disciplineViolation.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async getViolation(id: string) {
    const item = await this.prisma.disciplineViolation.findFirst({
      where: { id, deletedAt: null },
      include: this.violationInclude(),
    });
    if (!item) throw new NotFoundException("Discipline violation not found");
    return item;
  }

  async createViolation(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createViolationSchema, input);
    this.assertIncidentDateAllowed(data.incidentDate);
    await this.assertStudentExists(data.studentId);
    const rule = await this.getActiveRule(data.ruleId);
    const item = await this.prisma.disciplineViolation.create({
      data: {
        studentId: data.studentId,
        ruleId: data.ruleId,
        incidentDate: data.incidentDate,
        description: data.description || null,
        point: data.point ?? rule.point,
        reportedById: actor.id,
      },
      include: this.violationInclude(),
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.violation.create",
      entity: "DisciplineViolation",
      entityId: item.id,
      metadata: { id: item.id, studentId: item.studentId, ruleId: item.ruleId, status: item.status, action: "create" },
    });
    return item;
  }

  async updateViolation(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.getViolation(id);
    const data = parseWithSchema(updateViolationSchema, input);
    if (data.status) throw new BadRequestException("Use confirm or cancel endpoint to change violation status");
    if (data.incidentDate) this.assertIncidentDateAllowed(data.incidentDate);
    if (data.studentId) await this.assertStudentExists(data.studentId);
    let rulePoint: number | undefined;
    if (data.ruleId) {
      const rule = await this.getActiveRule(data.ruleId);
      rulePoint = rule.point;
    }
    const updateData: Record<string, unknown> = { ...data };
    delete updateData.status;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.ruleId && data.point === undefined) updateData.point = rulePoint;
    const item = await this.prisma.disciplineViolation.update({ where: { id }, data: updateData, include: this.violationInclude() });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.violation.update",
      entity: "DisciplineViolation",
      entityId: id,
      metadata: { id, studentId: item.studentId, ruleId: item.ruleId, status: item.status, action: "update" },
    });
    return item;
  }

  async deleteViolation(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getViolation(id);
    await this.prisma.disciplineViolation.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.violation.delete",
      entity: "DisciplineViolation",
      entityId: id,
      metadata: { id, studentId: existing.studentId, ruleId: existing.ruleId, status: existing.status, action: "delete" },
    });
    return { deleted: true, id };
  }

  async confirmViolation(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getViolation(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT violations can be confirmed");
    const item = await this.prisma.disciplineViolation.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedAt: new Date(), confirmedById: actor.id },
      include: this.violationInclude(),
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.violation.confirm",
      entity: "DisciplineViolation",
      entityId: id,
      metadata: { id, studentId: item.studentId, ruleId: item.ruleId, status: item.status, action: "confirm" },
    });
    await this.notificationEvents.disciplineViolationConfirmed(item, actor, meta);
    return item;
  }

  async cancelViolation(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getViolation(id);
    if (existing.status === "CANCELLED") throw new BadRequestException("Violation is already cancelled");
    const item = await this.prisma.disciplineViolation.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: this.violationInclude(),
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.violation.cancel",
      entity: "DisciplineViolation",
      entityId: id,
      metadata: { id, studentId: item.studentId, ruleId: item.ruleId, status: item.status, action: "cancel" },
    });
    return item;
  }

  async listAchievements(query: unknown) {
    const params = parseWithSchema(disciplineListQuerySchema, query);
    const where: Prisma.StudentAchievementWhereInput = { deletedAt: null };
    if (params.studentId) where.studentId = params.studentId;
    if (params.classroomId) where.student = { classroomId: params.classroomId };
    if (params.category) where.category = params.category;
    if (params.startDate || params.endDate) {
      where.awardedAt = {
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
      this.prisma.studentAchievement.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { awardedAt: "desc" },
        include: this.achievementInclude(),
      }),
      this.prisma.studentAchievement.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async getAchievement(id: string) {
    const item = await this.prisma.studentAchievement.findFirst({ where: { id, deletedAt: null }, include: this.achievementInclude() });
    if (!item) throw new NotFoundException("Student achievement not found");
    return item;
  }

  async createAchievement(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createAchievementSchema, input);
    await this.assertStudentExists(data.studentId);
    const item = await this.prisma.studentAchievement.create({
      data: { ...data, description: data.description || null, awardedById: actor.id },
      include: this.achievementInclude(),
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.achievement.create",
      entity: "StudentAchievement",
      entityId: item.id,
      metadata: { id: item.id, studentId: item.studentId, category: item.category, point: item.point, action: "create" },
    });
    await this.notificationEvents.studentAchievementCreated(item, actor, meta);
    return item;
  }

  async updateAchievement(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.getAchievement(id);
    const data = parseWithSchema(updateAchievementSchema, input);
    if (data.studentId) await this.assertStudentExists(data.studentId);
    const updateData: Record<string, unknown> = { ...data };
    if (data.description !== undefined) updateData.description = data.description || null;
    const item = await this.prisma.studentAchievement.update({ where: { id }, data: updateData, include: this.achievementInclude() });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.achievement.update",
      entity: "StudentAchievement",
      entityId: id,
      metadata: { id, studentId: item.studentId, category: item.category, point: item.point, action: "update" },
    });
    return item;
  }

  async deleteAchievement(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.getAchievement(id);
    await this.prisma.studentAchievement.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.achievement.delete",
      entity: "StudentAchievement",
      entityId: id,
      metadata: { id, studentId: existing.studentId, category: existing.category, point: existing.point, action: "delete" },
    });
    return { deleted: true, id };
  }

  async getStudentSummary(studentId: string, actor?: AuthenticatedUser, meta: RequestMeta = {}) {
    const summary = await this.buildStudentSummary(studentId);
    if (actor) {
      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "discipline.summary.view",
        entity: "Student",
        entityId: studentId,
        metadata: { studentId, action: "student-summary" },
      });
    }
    return summary;
  }

  async getClassroomSummary(classroomId: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, deletedAt: null },
      select: { id: true, code: true, name: true },
    });
    if (!classroom) throw new NotFoundException("Classroom not found");
    const students = await this.prisma.student.findMany({
      where: { classroomId, deletedAt: null },
      select: { id: true, nis: true, name: true },
      orderBy: { name: "asc" },
    });
    const studentIds = students.map((student) => student.id);
    const [violationRows, achievementRows] = await Promise.all([
      studentIds.length
        ? this.prisma.disciplineViolation.groupBy({
            by: ["studentId"],
            where: { studentId: { in: studentIds }, status: "CONFIRMED", deletedAt: null },
            _sum: { point: true },
            _count: true,
          })
        : Promise.resolve([]),
      studentIds.length
        ? this.prisma.studentAchievement.groupBy({
            by: ["studentId"],
            where: { studentId: { in: studentIds }, deletedAt: null },
            _sum: { point: true },
            _count: true,
          })
        : Promise.resolve([]),
    ]);
    const violationMap = new Map(violationRows.map((row) => [row.studentId, { point: row._sum.point ?? 0, count: row._count }]));
    const achievementMap = new Map(achievementRows.map((row) => [row.studentId, { point: row._sum.point ?? 0, count: row._count }]));
    const rows = students.map((student) => {
      const violation = violationMap.get(student.id) ?? { point: 0, count: 0 };
      const achievement = achievementMap.get(student.id) ?? { point: 0, count: 0 };
      return {
        student,
        totalViolationPoints: violation.point,
        totalAchievementPoints: achievement.point,
        netPoints: achievement.point - violation.point,
        violationCount: violation.count,
        achievementCount: achievement.count,
      };
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.summary.view",
      entity: "Classroom",
      entityId: classroomId,
      metadata: { classroomId, action: "classroom-summary" },
    });
    return {
      classroom,
      totals: {
        students: students.length,
        violationPoints: rows.reduce((sum, row) => sum + row.totalViolationPoints, 0),
        achievementPoints: rows.reduce((sum, row) => sum + row.totalAchievementPoints, 0),
        netPoints: rows.reduce((sum, row) => sum + row.netPoints, 0),
      },
      rows,
    };
  }

  async printViolation(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<PdfDocumentResult> {
    const violation = await this.getViolation(id);
    const summary = await this.buildStudentSummary(violation.studentId);
    const school = await this.pdfService.getSchoolHeader();
    const buffer = await this.pdfService.render(
      { ...school, title: "Bukti Pelanggaran Siswa", documentNumber: violation.id, printedAt: new Date() },
      (doc) => {
        this.pdfService.drawSectionTitle(doc, "Data Siswa");
        this.pdfService.drawKeyValueBlock(doc, [
          { label: "Nama", value: violation.student.name },
          { label: "NIS", value: violation.student.nis },
          { label: "Kelas", value: violation.student.classroom?.name ?? "-" },
          { label: "Tanggal Kejadian", value: formatDate(violation.incidentDate) },
        ]);
        this.pdfService.drawSectionTitle(doc, "Detail Pelanggaran");
        this.pdfService.drawKeyValueBlock(doc, [
          { label: "Aturan", value: `${violation.rule.code} - ${violation.rule.name}` },
          { label: "Severity", value: violation.rule.severity },
          { label: "Poin", value: violation.point },
          { label: "Status", value: violation.status },
        ]);
        this.pdfService.drawText(doc, `Deskripsi: ${violation.description || "-"}`);
        doc.moveDown(0.5);
        this.pdfService.drawSectionTitle(doc, "Ringkasan Poin");
        this.pdfService.drawKeyValueBlock(doc, [
          { label: "Total Poin Pelanggaran", value: summary.totalViolationPoints },
          { label: "Total Poin Prestasi", value: summary.totalAchievementPoints },
          { label: "Saldo Poin", value: summary.netPoints },
        ]);
        this.pdfService.drawSignatureBlock(doc, "", "BK/Tata Tertib");
      },
    );
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.print",
      entity: "DisciplineViolation",
      entityId: id,
      metadata: { id, studentId: violation.studentId, action: "violation-print" },
    });
    return { buffer, filename: `discipline-violation-${id}.pdf`, inline: true };
  }

  async printStudentSummary(studentId: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<PdfDocumentResult> {
    const summary = await this.buildStudentSummary(studentId);
    const school = await this.pdfService.getSchoolHeader();
    const buffer = await this.pdfService.render(
      { ...school, title: "Ringkasan Disiplin Siswa", documentNumber: studentId, printedAt: new Date() },
      (doc) => {
        this.pdfService.drawSectionTitle(doc, "Data Siswa");
        this.pdfService.drawKeyValueBlock(doc, [
          { label: "Nama", value: summary.student.name },
          { label: "NIS", value: summary.student.nis },
          { label: "Kelas", value: summary.student.classroom?.name ?? "-" },
          { label: "Saldo Poin", value: summary.netPoints },
        ]);
        this.pdfService.drawSectionTitle(doc, "Total Poin");
        this.pdfService.drawKeyValueBlock(doc, [
          { label: "Pelanggaran", value: summary.totalViolationPoints },
          { label: "Prestasi", value: summary.totalAchievementPoints },
          { label: "Jumlah Pelanggaran", value: summary.violationCount },
          { label: "Jumlah Prestasi", value: summary.achievementCount },
        ]);
        this.pdfService.drawSectionTitle(doc, "Pelanggaran Terbaru");
        this.pdfService.drawTable(
          doc,
          [
            { header: "Tanggal", width: 80 },
            { header: "Aturan", width: 230 },
            { header: "Severity", width: 80 },
            { header: "Poin", width: 60, align: "right" },
          ],
          summary.latestViolations.map((item) => ({
            cells: [
              { text: formatDate(item.incidentDate) },
              { text: item.rule.name },
              { text: item.rule.severity },
              { text: item.point, align: "right" as const },
            ],
          })),
        );
        this.pdfService.drawSectionTitle(doc, "Prestasi Terbaru");
        this.pdfService.drawTable(
          doc,
          [
            { header: "Tanggal", width: 80 },
            { header: "Judul", width: 230 },
            { header: "Kategori", width: 80 },
            { header: "Poin", width: 60, align: "right" },
          ],
          summary.latestAchievements.map((item) => ({
            cells: [
              { text: formatDate(item.awardedAt) },
              { text: item.title },
              { text: item.category },
              { text: item.point, align: "right" as const },
            ],
          })),
        );
        this.pdfService.drawSignatureBlock(doc, "", "BK/Tata Tertib");
      },
    );
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "discipline.print",
      entity: "Student",
      entityId: studentId,
      metadata: { studentId, action: "student-summary-print" },
    });
    return { buffer, filename: `discipline-summary-${studentId}.pdf`, inline: true };
  }

  private async buildStudentSummary(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true, nis: true, nisn: true, name: true, classroom: { select: { id: true, code: true, name: true } } },
    });
    if (!student) throw new NotFoundException("Student not found");
    const [violationAgg, achievementAgg, latestViolations, latestAchievements] = await Promise.all([
      this.prisma.disciplineViolation.aggregate({
        where: { studentId, status: "CONFIRMED", deletedAt: null },
        _sum: { point: true },
        _count: true,
      }),
      this.prisma.studentAchievement.aggregate({ where: { studentId, deletedAt: null }, _sum: { point: true }, _count: true }),
      this.prisma.disciplineViolation.findMany({
        where: { studentId, status: "CONFIRMED", deletedAt: null },
        orderBy: { incidentDate: "desc" },
        take: 10,
        include: this.violationInclude(),
      }),
      this.prisma.studentAchievement.findMany({
        where: { studentId, deletedAt: null },
        orderBy: { awardedAt: "desc" },
        take: 10,
        include: this.achievementInclude(),
      }),
    ]);
    const totalViolationPoints = violationAgg._sum.point ?? 0;
    const totalAchievementPoints = achievementAgg._sum.point ?? 0;
    return {
      student,
      totalViolationPoints,
      totalAchievementPoints,
      netPoints: totalAchievementPoints - totalViolationPoints,
      violationCount: violationAgg._count,
      achievementCount: achievementAgg._count,
      latestViolations,
      latestAchievements,
    };
  }

  private async assertStudentExists(studentId: string) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, deletedAt: null }, select: { id: true } });
    if (!student) throw new BadRequestException("Student not found");
  }

  private async getActiveRule(ruleId: string) {
    const rule = await this.prisma.disciplineRule.findFirst({ where: { id: ruleId, isActive: true } });
    if (!rule) throw new BadRequestException("Active discipline rule not found");
    return rule;
  }

  private assertIncidentDateAllowed(value: Date) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + MAX_FUTURE_INCIDENT_DAYS);
    if (value.getTime() > maxDate.getTime()) {
      throw new BadRequestException("Incident date is too far in the future");
    }
  }

  private violationInclude() {
    return {
      confirmedBy: { select: { id: true, email: true, name: true } },
      reportedBy: { select: { id: true, email: true, name: true } },
      rule: true,
      student: { select: { id: true, name: true, nis: true, nisn: true, classroom: { select: { id: true, code: true, name: true } } } },
    };
  }

  private achievementInclude() {
    return {
      awardedBy: { select: { id: true, email: true, name: true } },
      student: { select: { id: true, name: true, nis: true, nisn: true, classroom: { select: { id: true, code: true, name: true } } } },
    };
  }
}

function formatDate(value: Date) {
  return value.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}
