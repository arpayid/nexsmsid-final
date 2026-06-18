import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { PasswordService } from "../auth/password.service";
import { PrismaService } from "../database/prisma.service";
import { MailerService } from "../notifications/mailer.service";
import { generateTemporaryPassword } from "./generate-temporary-password";
import type { PortalAccountCredentials, PrismaTransactionClient, ProvisionStudentPortalParams } from "./portal-provisioning.types";

@Injectable()
export class PortalProvisioningService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(MailerService) private readonly mailer: MailerService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  isAutoProvisionEnabled() {
    return this.configService.get<string>("PPDB_AUTO_PROVISION_STUDENT_ACCOUNT") !== "false";
  }

  isEmailRequired() {
    return this.configService.get<string>("PPDB_PROVISION_EMAIL_REQUIRED") !== "false";
  }

  resolveStudentEmail(params: { registrationEmail?: string | null; overrideEmail?: string; nis?: string }) {
    const override = params.overrideEmail?.trim().toLowerCase();
    if (override) return override;

    const registrationEmail = params.registrationEmail?.trim().toLowerCase();
    if (registrationEmail) return registrationEmail;

    const domain = this.configService.get<string>("PPDB_PROVISION_EMAIL_DOMAIN")?.trim();
    if (domain && params.nis) {
      const localPart = params.nis.toLowerCase().replace(/[^a-z0-9]+/g, ".");
      return `siswa.${localPart}@${domain}`;
    }

    return null;
  }

  async provisionStudentPortal(input: ProvisionStudentPortalParams, tx?: PrismaTransactionClient): Promise<PortalAccountCredentials> {
    const credentials = tx
      ? await this.provisionStudentPortalInTransaction(tx, input)
      : await this.prisma.$transaction((transaction) => this.provisionStudentPortalInTransaction(transaction, input));

    if (!tx) {
      await this.auditService.record({
        ...input.meta,
        actorId: input.actorId,
        action: "portal.provision.student",
        entity: "student",
        entityId: input.studentId,
        metadata: { userId: credentials.userId, email: credentials.email, source: input.source },
      });

      if (input.sendWelcomeEmail) {
        await this.sendWelcomeEmail(credentials.email, input.name);
      }
    }

    return credentials;
  }

  async resetStudentPortalPassword(
    studentId: string,
    actorId: string,
    meta: ProvisionStudentPortalParams["meta"],
  ): Promise<PortalAccountCredentials> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: { user: true },
    });
    if (!student) throw new NotFoundException("Student not found");
    if (!student.userId || !student.user) {
      throw new BadRequestException("Siswa belum memiliki akun portal");
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwordService.hash(temporaryPassword);

    await this.prisma.user.update({
      where: { id: student.userId },
      data: { passwordHash, forceChangePassword: true },
    });

    await this.auditService.record({
      ...meta,
      actorId,
      action: "portal.reset-password.student",
      entity: "student",
      entityId: studentId,
      metadata: { userId: student.userId, email: student.user.email },
    });

    return {
      userId: student.userId,
      email: student.user.email,
      temporaryPassword,
      forceChangePassword: true,
    };
  }

  private async provisionStudentPortalInTransaction(
    tx: PrismaTransactionClient,
    input: ProvisionStudentPortalParams,
  ): Promise<PortalAccountCredentials> {
    const student = await tx.student.findFirst({
      where: { id: input.studentId, deletedAt: null },
    });
    if (!student) throw new NotFoundException("Student not found");
    if (student.userId) throw new ConflictException("Siswa sudah memiliki akun portal");

    const email = input.email.trim().toLowerCase();
    const existingUser = await tx.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existingUser) throw new ConflictException("Email sudah terdaftar sebagai akun pengguna");

    const siswaRole = await tx.role.findUnique({ where: { slug: "siswa" } });
    if (!siswaRole) throw new BadRequestException("Peran siswa belum dikonfigurasi");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwordService.hash(temporaryPassword);

    const user = await tx.user.create({
      data: {
        email,
        name: input.name,
        passwordHash,
        status: "ACTIVE",
        forceChangePassword: true,
        roles: { create: { roleId: siswaRole.id } },
      },
    });

    await tx.student.update({
      where: { id: input.studentId },
      data: { userId: user.id, email },
    });

    return {
      userId: user.id,
      email,
      temporaryPassword,
      forceChangePassword: true,
    };
  }

  async sendStudentWelcomeEmail(email: string, name: string) {
    await this.sendWelcomeEmail(email, name);
  }

  private async sendWelcomeEmail(email: string, name: string) {
    const loginUrl = `${this.configService.get<string>("WEB_ORIGIN") ?? "http://localhost:3000"}/login`;
    await this.mailer.send({
      to: email,
      subject: "Akun Portal Siswa NexSMSID",
      html: `
        <p>Halo ${name},</p>
        <p>Akun portal siswa Anda sudah aktif.</p>
        <p>Silakan login di <a href="${loginUrl}">${loginUrl}</a> menggunakan email ini.</p>
        <p>Password sementara akan diberikan oleh administrator sekolah. Wajib ganti password saat login pertama.</p>
      `,
    });
  }
}
