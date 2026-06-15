import { createReadStream, existsSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { writeFile } from "node:fs/promises";
import type { Response } from "express";

import { PasswordService } from "../auth/password.service";
import { parseWithSchema } from "../common/validation";
import { validatePpdbDocumentMagicBytes } from "../common/upload";
import { PrismaService } from "../database/prisma.service";
import { createPpdbRegistrationSchema } from "../ppdb-registrations/ppdb-registrations.dto";
import {
  assertPpdbFileKeyOwned,
  contentTypeForPpdbFilename,
  normalizePpdbStorageKey,
  PPDB_STORAGE_PREFIX,
  resolvePpdbAbsolutePath,
} from "./ppdb-file.util";
import { PpdbUploadTokenService } from "./ppdb-upload-token.service";

const ppdbFileKeySchema = z
  .string()
  .trim()
  .min(5)
  .max(512)
  .refine((value) => value.startsWith(`${PPDB_STORAGE_PREFIX}/`) && !value.includes(".."), {
    message: "fileKey tidak valid",
  });

@Injectable()
export class PublicPpdbService {
  private readonly storagePath: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) configService: ConfigService,
    @Inject(PpdbUploadTokenService) private readonly uploadTokens: PpdbUploadTokenService,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
  ) {
    this.storagePath = configService.get<string>("STORAGE_PATH") ?? "./storage";
  }

  async getActivePeriod() {
    const now = new Date();
    const period = await this.prisma.ppdbPeriod.findFirst({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: { academicYear: true },
    });
    if (!period) throw new NotFoundException("No active PPDB period found");
    return period;
  }

  async register(input: unknown) {
    const data = parseWithSchema(createPpdbRegistrationSchema, input);
    const now = new Date();
    const accessPinHash = await this.passwordService.hash(data.pin);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM ppdb_periods WHERE id = ${data.periodId} FOR UPDATE`;
          if (locked.length === 0) throw new BadRequestException("Invalid or inactive PPDB period");

          const period = await tx.ppdbPeriod.findFirst({
            where: { id: data.periodId, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
          });
          if (!period) throw new BadRequestException("Invalid or inactive PPDB period");

          if (period.quota) {
            const count = await tx.ppdbRegistration.count({ where: { periodId: period.id } });
            if (count >= period.quota) throw new BadRequestException("Registration quota for this period is full");
          }

          const registrationNumber = `REG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${randomUUID().slice(0, 8).toUpperCase()}`;

          const registration = await tx.ppdbRegistration.create({
            data: {
              registrationNumber,
              periodId: data.periodId,
              name: data.name,
              gender: data.gender,
              birthPlace: data.birthPlace || null,
              birthDate: data.birthDate || null,
              address: data.address || null,
              phone: data.phone,
              accessPinHash,
              email: data.email || null,
              previousSchool: data.previousSchool || null,
              selectedDepartmentId: data.selectedDepartmentId || null,
              selectedCompetencyId: data.selectedCompetencyId || null,
              status: "SUBMITTED",
              selectionStatus: "PENDING",
            },
            include: { period: true },
          });

          await tx.ppdbStatusHistory.create({
            data: { registrationId: registration.id, fromStatus: null, toStatus: "SUBMITTED", changedById: null },
          });

          return {
            ...registration,
            uploadToken: this.uploadTokens.issue(registration.id, registration.registrationNumber, registration.phone),
          };
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
        throw error;
      }
    }

    throw new ConflictException("Failed to allocate a unique registration number, please retry");
  }

  async saveUploadedDocument(file: Express.Multer.File, uploadToken?: string) {
    if (!uploadToken?.trim()) throw new UnauthorizedException("Token unggah wajib diisi");
    const token = this.uploadTokens.verify(uploadToken.trim());

    if (!file?.buffer?.length) throw new BadRequestException("File is required");
    validatePpdbDocumentMagicBytes(file.buffer, file.originalname);

    const safeName = (file.originalname ?? "document").replace(/[^a-zA-Z0-9._-]/g, "_");
    const relativePath = join(PPDB_STORAGE_PREFIX, token.registrationId, `${randomUUID()}-${safeName}`);
    const absolutePath = resolvePpdbAbsolutePath(this.storagePath, relativePath);
    mkdirSync(join(this.storagePath, PPDB_STORAGE_PREFIX, token.registrationId), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return { fileKey: normalizePpdbStorageKey(relativePath) };
  }

  async submitDocument(input: unknown) {
    const schema = z.object({
      registrationNumber: z.string().min(3),
      phone: z.string().min(8),
      name: z.string().trim().min(1).max(200),
      fileKey: ppdbFileKeySchema,
      uploadToken: z.string().min(10),
    });
    const data = parseWithSchema(schema, input);
    const token = this.uploadTokens.verify(data.uploadToken);

    if (
      token.registrationNumber.trim().toUpperCase() !== data.registrationNumber.trim().toUpperCase() ||
      token.phone.trim() !== data.phone.trim()
    ) {
      throw new UnauthorizedException("Token unggah tidak cocok dengan data pendaftaran");
    }

    const registration = await this.prisma.ppdbRegistration.findFirst({
      where: {
        id: token.registrationId,
        registrationNumber: { equals: data.registrationNumber.trim(), mode: "insensitive" },
        phone: data.phone.trim(),
      },
    });
    if (!registration) {
      throw new NotFoundException("Pendaftaran tidak ditemukan. Periksa nomor registrasi dan nomor telepon.");
    }

    assertPpdbFileKeyOwned(data.fileKey, registration.id);
    const absolutePath = resolvePpdbAbsolutePath(this.storagePath, data.fileKey);
    if (!existsSync(absolutePath)) {
      throw new BadRequestException("File belum diunggah atau sudah kedaluwarsa");
    }

    return this.prisma.ppdbDocument.create({
      data: {
        registrationId: registration.id,
        name: data.name,
        fileUrl: normalizePpdbStorageKey(data.fileKey),
      },
    });
  }

  async streamDocumentFile(documentId: string, uploadToken: string, response: Response) {
    const token = this.uploadTokens.verify(uploadToken);
    const document = await this.prisma.ppdbDocument.findUnique({ where: { id: documentId } });
    if (!document || document.registrationId !== token.registrationId) {
      throw new NotFoundException("Dokumen tidak ditemukan");
    }

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
