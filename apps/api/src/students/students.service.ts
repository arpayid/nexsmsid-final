import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { BasePeopleService } from "../people/base-people.service";
import { PortalProvisioningService } from "../portal-provisioning/portal-provisioning.service";
import { provisionStudentPortalSchema } from "../portal-provisioning/portal-provisioning.dto";
import { createStudentSchema, linkStudentGuardianSchema, updateStudentGuardianSchema, updateStudentSchema } from "./students.dto";

@Injectable()
export class StudentsService extends BasePeopleService<typeof createStudentSchema, typeof updateStudentSchema> {
  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditService) auditService: AuditService,
    @Inject(PortalProvisioningService) private readonly portalProvisioning: PortalProvisioningService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    super(prisma, auditService, {
      auditEntity: "student",
      createSchema: createStudentSchema,
      defaultOrderBy: { name: "asc" },
      include: { classroom: true },
      modelName: "student",
      searchableFields: ["nis", "nisn", "name", "email", "phone"],
      updateSchema: updateStudentSchema,
      useSoftDelete: true,
    });
  }

  async provisionPortalAccount(studentId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const student = await this.findById(studentId);
    const data = parseWithSchema(provisionStudentPortalSchema, input ?? {});
    const email = this.portalProvisioning.resolveStudentEmail({
      registrationEmail: typeof student.email === "string" ? student.email : null,
      overrideEmail: data.email,
      nis: typeof student.nis === "string" ? student.nis : undefined,
    });

    if (!email) {
      throw new BadRequestException("Email wajib untuk membuat akun portal siswa");
    }

    const sendWelcomeEmail = data.sendWelcomeEmail ?? Boolean(this.configService.get<string>("SMTP_HOST")?.trim());

    return this.portalProvisioning.provisionStudentPortal({
      studentId,
      email,
      name: String(student.name),
      actorId: actor.id,
      meta,
      source: "manual",
      sendWelcomeEmail,
    });
  }

  async resetPortalPassword(studentId: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(studentId);
    return this.portalProvisioning.resetStudentPortalPassword(studentId, actor.id, meta);
  }

  async findClassroomIdByCode(code: string): Promise<string | null> {
    const classroom = await this.prisma.classroom.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
      select: { id: true },
    });
    return classroom?.id ?? null;
  }

  async createRaw(data: Record<string, unknown>) {
    return this.prisma.student.create({
      data: data as never,
      include: { classroom: true },
    });
  }

  async exportAll(): Promise<Record<string, unknown>[]> {
    const items = await this.prisma.student.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { classroom: true },
    });

    return items.map((item) => {
      const record: Record<string, unknown> = { ...item };
      const classroom = (item as { classroom?: { code?: string } | null }).classroom;
      record.classroomCode = classroom?.code ?? "";
      delete record.classroom;
      return record;
    });
  }

  async listGuardians(studentId: string) {
    await this.findById(studentId);
    return this.prisma.studentGuardian.findMany({
      where: { studentId },
      include: { guardian: true },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  }

  async linkGuardian(studentId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(studentId);
    const data = parseWithSchema(linkStudentGuardianSchema, input);
    const guardian = await this.prisma.guardian.findFirst({ where: { id: data.guardianId } });
    if (!guardian) throw new NotFoundException("Guardian not found");

    const existing = await this.prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId: data.guardianId } },
    });
    if (existing) throw new ConflictException("Guardian is already linked to this student");

    if (data.isPrimary) {
      await this.prisma.studentGuardian.updateMany({ where: { studentId, isPrimary: true }, data: { isPrimary: false } });
    }

    const link = await this.prisma.studentGuardian.create({
      data: { studentId, guardianId: data.guardianId, isPrimary: data.isPrimary },
      include: { guardian: true },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "student-guardian.link",
      entity: "student_guardian",
      entityId: `${studentId}:${data.guardianId}`,
      metadata: { studentId, guardianId: data.guardianId, isPrimary: data.isPrimary },
    });

    return link;
  }

  async updateGuardianLink(studentId: string, guardianId: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(updateStudentGuardianSchema, input);
    const link = await this.prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId } },
    });
    if (!link) throw new NotFoundException("Student-guardian link not found");

    if (data.isPrimary) {
      await this.prisma.studentGuardian.updateMany({ where: { studentId, isPrimary: true }, data: { isPrimary: false } });
    }

    const updated = await this.prisma.studentGuardian.update({
      where: { studentId_guardianId: { studentId, guardianId } },
      data: { isPrimary: data.isPrimary },
      include: { guardian: true },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "student-guardian.update",
      entity: "student_guardian",
      entityId: `${studentId}:${guardianId}`,
      metadata: data,
    });

    return updated;
  }

  async unlinkGuardian(studentId: string, guardianId: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const link = await this.prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId } },
    });
    if (!link) throw new NotFoundException("Student-guardian link not found");

    await this.prisma.studentGuardian.delete({ where: { studentId_guardianId: { studentId, guardianId } } });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "student-guardian.unlink",
      entity: "student_guardian",
      entityId: `${studentId}:${guardianId}`,
      metadata: { studentId, guardianId },
    });

    return { deleted: true, studentId, guardianId };
  }
}
