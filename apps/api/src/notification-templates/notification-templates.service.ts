import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import {
  createNotificationTemplateSchema,
  notificationTemplateListQuerySchema,
  updateNotificationTemplateSchema,
} from "./notification-templates.dto";

@Injectable()
export class NotificationTemplatesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async list(query: unknown) {
    const params = parseWithSchema(notificationTemplateListQuerySchema, query);
    const where: Prisma.NotificationTemplateWhereInput = { deletedAt: null };
    if (params.channel) where.channel = params.channel as never;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: "insensitive" } },
        { name: { contains: params.search, mode: "insensitive" } },
        { body: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, email: true, name: true } } },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string) {
    const item = await this.prisma.notificationTemplate.findFirst({
      where: { id, deletedAt: null },
      include: { createdBy: { select: { id: true, email: true, name: true } } },
    });
    if (!item) throw new NotFoundException("Notification template not found");
    return item;
  }

  async create(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(createNotificationTemplateSchema, input);

    try {
      const item = await this.prisma.notificationTemplate.create({ data: { ...this.cleanOptional(data), createdById: actor.id } as never });
      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "notification-template.create",
        entity: "notification_template",
        entityId: item.id,
        metadata: { code: item.code },
      });
      return item;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async update(id: string, input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    const data = parseWithSchema(updateNotificationTemplateSchema, input);

    try {
      const item = await this.prisma.notificationTemplate.update({ where: { id }, data: this.cleanOptional(data) });
      await this.auditService.record({
        ...meta,
        actorId: actor.id,
        action: "notification-template.update",
        entity: "notification_template",
        entityId: id,
        metadata: data,
      });
      return item;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id);
    await this.prisma.notificationTemplate.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "notification-template.delete",
      entity: "notification_template",
      entityId: id,
      metadata: {},
    });
    return { deleted: true, id };
  }

  private cleanOptional(data: Record<string, unknown>) {
    const cleaned = { ...data };
    if (cleaned.subject === "") cleaned.subject = null;
    return cleaned;
  }

  private handleUniqueError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new ConflictException("Notification template code already exists");
  }
}
