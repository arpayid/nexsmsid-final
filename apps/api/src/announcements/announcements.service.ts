import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { NotificationEventService } from "../notifications/notification-event.service";
import { announcementListQuerySchema, createAnnouncementSchema, updateAnnouncementSchema } from "./announcements.dto";

@Injectable()
export class AnnouncementsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationEventService) private readonly notificationEvents: NotificationEventService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(announcementListQuerySchema, query);
    const where = this.buildWhere(params, false);
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, email: true, name: true } }, _count: { select: { recipients: true } } },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async publicList(query: unknown) {
    const params = parseWithSchema(announcementListQuerySchema, query);
    const where = this.buildWhere(params, true);
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({ where, skip, take: params.limit, orderBy: { publishedAt: "desc" } }),
      this.prisma.announcement.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.announcement.findFirst({
      where: { id, deletedAt: null },
      include: { createdBy: { select: { id: true, email: true, name: true } }, recipients: true },
    });

    if (!item) throw new NotFoundException("Announcement not found");
    return item;
  }

  async publicFindById(id: string) {
    const item = await this.prisma.announcement.findFirst({ where: { id, deletedAt: null, status: "PUBLISHED" } });
    if (!item) throw new NotFoundException("Announcement not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createAnnouncementSchema, input);
    const item = await this.prisma.announcement.create({
      data: {
        ...data,
        createdById: actor.id,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        archivedAt: data.status === "ARCHIVED" ? new Date() : null,
      },
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "announcement.create",
      entity: "announcement",
      entityId: item.id,
      metadata: { title: item.title },
    });
    if (item.status === "PUBLISHED") await this.notificationEvents.announcementPublished(item, actor, meta);
    return item;
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    const data = parseWithSchema(updateAnnouncementSchema, input);
    const updateData: Prisma.AnnouncementUpdateInput = { ...data };

    if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") updateData.publishedAt = new Date();
    if (data.status === "ARCHIVED" && existing.status !== "ARCHIVED") updateData.archivedAt = new Date();

    const item = await this.prisma.announcement.update({ where: { id }, data: updateData });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "announcement.update",
      entity: "announcement",
      entityId: id,
      metadata: data,
    });
    if (item.status === "PUBLISHED" && existing.status !== "PUBLISHED")
      await this.notificationEvents.announcementPublished(item, actor, meta);
    return item;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    await this.prisma.announcement.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED", archivedAt: new Date() } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "announcement.delete",
      entity: "announcement",
      entityId: id,
      metadata: {},
    });
    return { deleted: true, id };
  }

  async publish(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status === "PUBLISHED") throw new BadRequestException("Announcement is already published");
    const item = await this.prisma.announcement.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date(), archivedAt: null },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "announcement.publish",
      entity: "announcement",
      entityId: id,
      metadata: {},
    });
    await this.notificationEvents.announcementPublished(item, actor, meta);
    return item;
  }

  async archive(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.findById(id);
    if (existing.status === "ARCHIVED") throw new BadRequestException("Announcement is already archived");
    const item = await this.prisma.announcement.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "announcement.archive",
      entity: "announcement",
      entityId: id,
      metadata: {},
    });
    return item;
  }

  private buildWhere(params: { search?: string; status?: string; audience?: string }, publicOnly: boolean) {
    const where: Prisma.AnnouncementWhereInput = { deletedAt: null };
    where.status = (publicOnly ? "PUBLISHED" : params.status) as never;
    if (params.audience) where.audience = params.audience as never;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { content: { contains: params.search, mode: "insensitive" } },
      ];
    }

    return where;
  }
}
