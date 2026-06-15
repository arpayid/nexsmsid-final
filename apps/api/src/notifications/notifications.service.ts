import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { NotificationDispatchService } from "./notification-dispatch.service";
import { createNotificationSchema, notificationListQuerySchema } from "./notifications.dto";

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(NotificationDispatchService) private readonly dispatchService: NotificationDispatchService,
  ) {}

  async list(query: unknown, actor: AuthenticatedUser) {
    const params = parseWithSchema(notificationListQuerySchema, query);
    const where: Prisma.NotificationWhereInput = { userId: actor.id };
    if (params.status) where.status = params.status as never;
    if (params.channel) where.channel = params.channel as never;
    if (params.search) {
      where.OR = [{ title: { contains: params.search, mode: "insensitive" } }, { body: { contains: params.search, mode: "insensitive" } }];
    }

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip, take: params.limit, orderBy: { createdAt: "desc" } }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async unreadCount(actor: AuthenticatedUser) {
    return { total: await this.prisma.notification.count({ where: { userId: actor.id, status: "UNREAD" } }) };
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createNotificationSchema, input);
    const item = await this.createSystemNotification({
      userId: data.userId,
      title: data.title,
      body: data.body,
      channel: data.channel,
      metadata: data.metadata,
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "notification.create",
      entity: "notification",
      entityId: item.id,
      metadata: { userId: data.userId },
    });
    return item;
  }

  async createSystemNotification(data: { userId: string; title: string; body: string; channel?: string; metadata?: any }) {
    const recipient = await this.prisma.user.findFirst({ where: { id: data.userId, deletedAt: null, status: "ACTIVE" } });
    if (!recipient) throw new NotFoundException("Notification recipient not found");

    const channels =
      data.channel === "EMAIL"
        ? (["IN_APP", "EMAIL"] as const)
        : data.channel === "WHATSAPP"
          ? (["IN_APP", "WHATSAPP"] as const)
          : (["IN_APP"] as const);

    await this.dispatchService.notifyUsers(
      [data.userId],
      {
        action: "system.notification",
        title: data.title,
        body: data.body,
        entityId: data.userId,
        entityType: "system",
        type: "SYSTEM",
        metadata: data.metadata,
        channels: [...channels],
      },
      {
        action: "notification.system",
        actorId: null,
        entity: "notification",
        entityId: data.userId,
        ipAddress: "system",
        userAgent: "system",
      },
    );

    const item = await this.prisma.notification.findFirst({
      where: { userId: data.userId },
      orderBy: { createdAt: "desc" },
    });
    if (!item) throw new NotFoundException("Notification could not be created");
    return item;
  }

  async markRead(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId: actor.id } });
    if (!existing) throw new NotFoundException("Notification not found");

    const item = await this.prisma.notification.update({ where: { id }, data: { status: "READ", readAt: existing.readAt ?? new Date() } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "notification.read",
      entity: "notification",
      entityId: id,
      metadata: {},
    });
    return item;
  }

  async markAllRead(actor: AuthenticatedUser, meta: RequestMeta) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: actor.id, status: "UNREAD" },
      data: { status: "READ", readAt: new Date() },
    });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "notification.read-all",
      entity: "notification",
      metadata: { count: result.count },
    });
    return { updated: result.count };
  }

  async archive(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId: actor.id } });
    if (!existing) throw new NotFoundException("Notification not found");

    const item = await this.prisma.notification.update({ where: { id }, data: { status: "ARCHIVED" } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "notification.archive",
      entity: "notification",
      entityId: id,
      metadata: {},
    });
    return item;
  }
}
