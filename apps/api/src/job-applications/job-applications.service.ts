import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import type { Response } from "express";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { contentTypeForPpdbFilename } from "../public-ppdb/ppdb-file.util";
import { NotificationEventService } from "../notifications/notification-event.service";
import { jobApplicationListQuerySchema, jobApplicationNoteSchema, updateJobApplicationSchema } from "./job-applications.dto";

const JOB_CV_PREFIX = "jobs/";

@Injectable()
export class JobApplicationsService {
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
    const params = parseWithSchema(jobApplicationListQuerySchema, query);
    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.jobVacancyId) where.jobVacancyId = params.jobVacancyId;
    if (params.search) {
      where.OR = [
        { applicantName: { contains: params.search, mode: "insensitive" } },
        { applicantEmail: { contains: params.search, mode: "insensitive" } },
        { jobVacancy: { title: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    const skip = (params.page - 1) * params.limit;
    const include = { jobVacancy: { include: { industryPartner: true } }, alumni: true };
    const [items, total] = await Promise.all([
      this.prisma.jobApplication.findMany({ where, skip, take: params.limit, orderBy: { createdAt: "desc" }, include }),
      this.prisma.jobApplication.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.jobApplication.findFirst({
      where: { id },
      include: { jobVacancy: { include: { industryPartner: true } }, alumni: true },
    });
    if (!item) throw new NotFoundException("Job application not found");
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    const data = parseWithSchema(updateJobApplicationSchema, input);
    if (data.status && !this.canTransition(existing.status, data.status))
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${data.status}`);
    const item = await this.prisma.jobApplication.update({
      where: { id },
      data: this.cleanOptional(data),
      include: { jobVacancy: true, alumni: true },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "job-application.update",
      entity: "job_application",
      entityId: id,
      metadata: data,
    });
    if (data.status && data.status !== existing.status) await this.notificationEvents.jobApplicationStatusChanged(item, actor, meta);
    return item;
  }

  async review(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    return this.changeStatus(id, "REVIEWED", actor, meta, "job-application.review");
  }

  async accept(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(jobApplicationNoteSchema, input);
    return this.changeStatus(id, "ACCEPTED", actor, meta, "job-application.accept", data.note);
  }

  async reject(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(jobApplicationNoteSchema, input);
    return this.changeStatus(id, "REJECTED", actor, meta, "job-application.reject", data.note);
  }

  async streamCvByApplicationId(id: string, response: Response) {
    const application = await this.findById(id);
    if (!application.cvUrl) throw new NotFoundException("CV not uploaded for this application");

    const cvKey = application.cvUrl.replace(/^\/+/, "");
    if (!cvKey.startsWith(JOB_CV_PREFIX) || cvKey.includes("..")) {
      throw new BadRequestException("CV file reference is invalid");
    }

    const absolutePath = join(this.storagePath, cvKey);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException("CV file not found");
    }

    const filename = absolutePath.split(/[/\\]/).pop() ?? "cv.pdf";
    response.setHeader("Content-Type", contentTypeForPpdbFilename(filename));
    response.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return new Promise<void>((resolve, reject) => {
      const stream = createReadStream(absolutePath);
      stream.on("error", reject);
      stream.on("end", () => resolve());
      stream.pipe(response);
    });
  }

  private async changeStatus(
    id: string,
    status: "REVIEWED" | "ACCEPTED" | "REJECTED",
    actor: AuthenticatedUser,
    meta: RequestMeta,
    action: string,
    note?: string,
  ) {
    const existing = await this.findById(id);
    if (!this.canTransition(existing.status, status))
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${status}`);
    const item = await this.prisma.jobApplication.update({
      where: { id },
      data: { status, note: note || existing.note },
      include: { jobVacancy: true, alumni: true },
    });
    await this.auditService.record({ ...meta, actorId: actor.id, action, entity: "job_application", entityId: id, metadata: { status } });
    await this.notificationEvents.jobApplicationStatusChanged(item, actor, meta);
    return item;
  }

  private canTransition(from: string, to: string) {
    const map: Record<string, string[]> = {
      SUBMITTED: ["REVIEWED", "INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"],
      REVIEWED: ["INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"],
      INTERVIEW: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
      ACCEPTED: [],
      REJECTED: [],
      WITHDRAWN: [],
    };
    return map[from]?.includes(to) ?? false;
  }

  private cleanOptional(data: Record<string, unknown>) {
    const cleaned = { ...data };
    for (const key of ["applicantEmail", "applicantPhone", "cvUrl", "note"]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    return cleaned;
  }
}
