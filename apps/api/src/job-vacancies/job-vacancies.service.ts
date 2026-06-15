import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { validatePpdbDocumentMagicBytes } from "../common/upload";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { JobCvUploadTokenService } from "./job-cv-upload-token.service";
import { createJobVacancySchema, jobVacancyListQuerySchema, publicJobApplySchema, updateJobVacancySchema } from "./job-vacancies.dto";

const JOB_CV_PREFIX = "jobs";

@Injectable()
export class JobVacanciesService {
  private readonly storagePath: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(JobCvUploadTokenService) private readonly cvUploadTokens: JobCvUploadTokenService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    this.storagePath = configService.get<string>("STORAGE_PATH") ?? "./storage";
  }

  async list(query: unknown) {
    const params = parseWithSchema(jobVacancyListQuerySchema, query);
    const where = this.buildWhere(params, false);
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.jobVacancy.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { industryPartner: true, _count: { select: { applications: true } } },
      }),
      this.prisma.jobVacancy.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async publicList(query: unknown) {
    const params = parseWithSchema(jobVacancyListQuerySchema, query);
    const where = this.buildWhere(params, true);
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.jobVacancy.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { publishedAt: "desc" },
        include: { industryPartner: true },
      }),
      this.prisma.jobVacancy.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.jobVacancy.findFirst({
      where: { id, deletedAt: null },
      include: { industryPartner: true, applications: true },
    });
    if (!item) throw new NotFoundException("Job vacancy not found");
    return item;
  }

  async publicFindById(id: string) {
    const item = await this.prisma.jobVacancy.findFirst({
      where: { id, deletedAt: null, status: "PUBLISHED" },
      include: { industryPartner: true },
    });
    if (!item) throw new NotFoundException("Job vacancy not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createJobVacancySchema, input);
    const item = await this.prisma.jobVacancy.create({
      data: this.cleanOptional({ ...data, publishedAt: data.status === "PUBLISHED" ? new Date() : null }) as never,
      include: { industryPartner: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "job-vacancy.create",
      entity: "job_vacancy",
      entityId: item.id,
      metadata: { title: item.title },
    });
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updateJobVacancySchema, input);
    const item = await this.prisma.jobVacancy.update({ where: { id }, data: this.cleanOptional(data), include: { industryPartner: true } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "job-vacancy.update",
      entity: "job_vacancy",
      entityId: id,
      metadata: data,
    });
    return item;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    await this.prisma.jobVacancy.update({ where: { id }, data: { deletedAt: new Date(), status: "CANCELLED" } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "job-vacancy.delete",
      entity: "job_vacancy",
      entityId: id,
      metadata: {},
    });
    return { deleted: true, id };
  }

  async publish(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "DRAFT") throw new BadRequestException("Only DRAFT vacancies can be published");
    const item = await this.prisma.jobVacancy.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
      include: { industryPartner: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "job-vacancy.publish",
      entity: "job_vacancy",
      entityId: id,
      metadata: {},
    });
    return item;
  }

  async close(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status !== "PUBLISHED") throw new BadRequestException("Only PUBLISHED vacancies can be closed");
    const item = await this.prisma.jobVacancy.update({ where: { id }, data: { status: "CLOSED" }, include: { industryPartner: true } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "job-vacancy.close",
      entity: "job_vacancy",
      entityId: id,
      metadata: {},
    });
    return item;
  }

  async publicApply(id: string, input: unknown) {
    const job = await this.prisma.jobVacancy.findFirst({ where: { id, deletedAt: null } });
    if (!job) throw new NotFoundException("Job vacancy not found");
    if (job.status !== "PUBLISHED") throw new BadRequestException("This job vacancy is not accepting applications");
    const data = parseWithSchema(publicJobApplySchema, input);
    if (data.cvUrl) {
      const cvKey = data.cvUrl.replace(/^\/+/, "");
      if (!cvKey.startsWith(`${JOB_CV_PREFIX}/${id}/`) || cvKey.includes("..")) {
        throw new BadRequestException("CV file reference is invalid");
      }
      const absolutePath = join(this.storagePath, cvKey);
      if (!existsSync(absolutePath)) {
        throw new BadRequestException("CV file not found. Please upload again.");
      }
    }
    if (data.applicantEmail) {
      const existing = await this.prisma.jobApplication.findFirst({ where: { jobVacancyId: id, applicantEmail: data.applicantEmail } });
      if (existing) throw new ConflictException("Applicant email has already applied for this job");
    }
    try {
      return await this.prisma.jobApplication.create({
        data: { jobVacancyId: id, ...this.cleanOptional(data), status: "SUBMITTED" } as never,
        include: { jobVacancy: true, alumni: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        throw new ConflictException("Applicant email has already applied for this job");
      throw error;
    }
  }

  async issueCvUploadToken(id: string) {
    await this.publicFindById(id);
    return { uploadToken: this.cvUploadTokens.issue(id) };
  }

  async saveUploadedCv(file: Express.Multer.File, uploadToken?: string) {
    if (!uploadToken?.trim()) throw new UnauthorizedException("Token unggah wajib diisi");
    const token = this.cvUploadTokens.verify(uploadToken.trim());

    if (!file?.buffer?.length) throw new BadRequestException("File is required");
    validatePpdbDocumentMagicBytes(file.buffer, file.originalname);

    const safeName = (file.originalname ?? "cv.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
    const relativePath = join(JOB_CV_PREFIX, token.jobVacancyId, `${randomUUID()}-${safeName}`);
    const absolutePath = join(this.storagePath, relativePath);
    mkdirSync(join(this.storagePath, JOB_CV_PREFIX, token.jobVacancyId), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return { cvUrl: relativePath.replace(/\\/g, "/") };
  }

  private buildWhere(params: { search?: string; status?: string }, publishedOnly: boolean) {
    const where: Record<string, unknown> = { deletedAt: null };
    where.status = publishedOnly ? "PUBLISHED" : (params.status ?? undefined);
    if (!where.status) delete where.status;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { companyName: { contains: params.search, mode: "insensitive" } },
        { location: { contains: params.search, mode: "insensitive" } },
      ];
    }
    return where;
  }

  private cleanOptional(data: Record<string, unknown>) {
    const cleaned = { ...data };
    for (const key of [
      "industryPartnerId",
      "qualification",
      "location",
      "employmentType",
      "salaryRange",
      "alumniId",
      "applicantEmail",
      "applicantPhone",
      "cvUrl",
      "note",
    ]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    return cleaned;
  }
}
