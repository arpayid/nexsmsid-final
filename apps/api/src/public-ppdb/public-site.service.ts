import { ConflictException, Injectable, Inject, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PasswordService } from "../auth/password.service";
import { PrismaService } from "../database/prisma.service";
import { PpdbUploadTokenService } from "./ppdb-upload-token.service";

@Injectable()
export class PublicSiteService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PpdbUploadTokenService) private readonly uploadTokens: PpdbUploadTokenService,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async getSchoolProfile() {
    const profile = await this.prisma.schoolProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!profile) {
      throw new NotFoundException("School profile not found");
    }
    return profile;
  }

  async getCompetencies() {
    return this.prisma.competency.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        department: {
          select: { id: true, code: true, name: true, description: true },
        },
      },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    });
  }

  async getPartners() {
    return this.prisma.industryPartner.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        website: true,
        address: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    });
  }

  async getPpdbOverview() {
    const now = new Date();
    const period = await this.prisma.ppdbPeriod.findFirst({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: { academicYear: { select: { id: true, name: true } } },
    });
    if (!period) return null;

    const registeredCount = await this.prisma.ppdbRegistration.count({
      where: { periodId: period.id },
    });

    return {
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      quota: period.quota,
      academicYear: period.academicYear,
      registeredCount,
      fillPercent: period.quota ? Math.min(100, Math.round((registeredCount / period.quota) * 100)) : null,
    };
  }

  async checkRegistrationStatus(registrationNumber: string, phone: string, pin?: string) {
    const normalizedRegistrationNumber = registrationNumber.trim();
    const registration = await this.prisma.ppdbRegistration.findFirst({
      where: {
        registrationNumber: { equals: normalizedRegistrationNumber, mode: "insensitive" },
        phone: phone.trim(),
      },
      include: {
        period: { select: { name: true } },
        selectedDepartment: { select: { name: true } },
        selectedCompetency: { select: { name: true } },
        documents: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!registration) {
      throw new NotFoundException("Pendaftaran tidak ditemukan. Periksa nomor registrasi dan nomor telepon.");
    }

    if (!registration.accessPinHash) {
      if (this.isLegacyPinGraceExpired()) {
        throw new UnauthorizedException("PIN wajib. Gunakan menu set PIN atau hubungi sekolah.");
      }

      return {
        registrationNumber: registration.registrationNumber,
        name: registration.name,
        status: registration.status,
        selectionStatus: registration.selectionStatus,
        periodName: registration.period.name,
        requiresPinSetup: true,
        message: "Silakan set PIN akses untuk melanjutkan unggah dokumen.",
      };
    }

    if (!pin || !(await this.passwordService.verify(pin, registration.accessPinHash))) {
      throw new UnauthorizedException("PIN akses tidak valid");
    }

    return {
      registrationNumber: registration.registrationNumber,
      name: registration.name,
      status: registration.status,
      selectionStatus: registration.selectionStatus,
      periodName: registration.period.name,
      departmentName: registration.selectedDepartment?.name ?? null,
      competencyName: registration.selectedCompetency?.name ?? null,
      createdAt: registration.createdAt,
      requiresPinSetup: false,
      uploadToken: this.uploadTokens.issue(registration.id, registration.registrationNumber, registration.phone),
      documents: registration.documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        createdAt: doc.createdAt,
      })),
    };
  }

  async setAccessPin(registrationNumber: string, phone: string, pin: string) {
    const registration = await this.prisma.ppdbRegistration.findFirst({
      where: {
        registrationNumber: { equals: registrationNumber.trim(), mode: "insensitive" },
        phone: phone.trim(),
      },
    });
    if (!registration) {
      throw new NotFoundException("Pendaftaran tidak ditemukan. Periksa nomor registrasi dan nomor telepon.");
    }
    if (registration.accessPinHash) {
      throw new ConflictException("PIN sudah diatur. Gunakan cek status dengan PIN.");
    }
    if (this.isLegacyPinGraceExpired()) {
      throw new UnauthorizedException("Masa grace set PIN telah berakhir. Hubungi sekolah.");
    }

    const accessPinHash = await this.passwordService.hash(pin);
    await this.prisma.ppdbRegistration.update({
      where: { id: registration.id },
      data: { accessPinHash },
    });

    return { success: true, message: "PIN akses berhasil diatur" };
  }

  private isLegacyPinGraceExpired(): boolean {
    const configured = this.configService.get<string>("PPDB_LEGACY_PIN_GRACE_END");
    const graceEnd = configured ? new Date(configured) : new Date("2026-07-15T00:00:00.000Z");
    return Date.now() > graceEnd.getTime();
  }
}
