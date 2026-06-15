import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { parseWithSchema } from "../common/validation";
import { PrismaService } from "../database/prisma.service";
import { messageListQuerySchema, sendMessageSchema } from "./internal-messages.dto";

@Injectable()
export class InternalMessagesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async inbox(query: unknown, actor: AuthenticatedUser) {
    const params = parseWithSchema(messageListQuerySchema, query);
    const where = this.buildWhere(params, { recipientId: actor.id });
    return this.listWithWhere(where, params.page, params.limit);
  }

  async sent(query: unknown, actor: AuthenticatedUser) {
    const params = parseWithSchema(messageListQuerySchema, query);
    const where = this.buildWhere(params, { senderId: actor.id });
    return this.listWithWhere(where, params.page, params.limit);
  }

  async findById(id: string, actor: AuthenticatedUser) {
    const item = await this.prisma.internalMessage.findFirst({
      where: { id, deletedAt: null, OR: [{ senderId: actor.id }, { recipientId: actor.id }] },
      include: this.includeUsers(),
    });

    if (!item) throw new NotFoundException("Message not found");
    return item;
  }

  async send(input: unknown, actor: AuthenticatedUser, meta: RequestMeta) {
    const data = parseWithSchema(sendMessageSchema, input);
    const recipient = await this.prisma.user.findFirst({ where: { id: data.recipientId, deletedAt: null, status: "ACTIVE" } });
    if (!recipient) throw new NotFoundException("Recipient not found");

    const item = await this.prisma.internalMessage.create({
      data: { senderId: actor.id, recipientId: data.recipientId, subject: data.subject, body: data.body, status: "SENT" },
      include: this.includeUsers(),
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "message.send",
      entity: "internal_message",
      entityId: item.id,
      metadata: { recipientId: data.recipientId },
    });
    return item;
  }

  async markRead(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    const existing = await this.prisma.internalMessage.findFirst({ where: { id, recipientId: actor.id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Message not found");

    const item = await this.prisma.internalMessage.update({
      where: { id },
      data: { status: "READ", readAt: existing.readAt ?? new Date(), readById: actor.id },
      include: this.includeUsers(),
    });

    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "message.read",
      entity: "internal_message",
      entityId: id,
      metadata: {},
    });
    return item;
  }

  async delete(id: string, actor: AuthenticatedUser, meta: RequestMeta) {
    await this.findById(id, actor);
    await this.prisma.internalMessage.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date() } });
    await this.auditService.record({
      ...meta,
      actorId: actor.id,
      action: "message.delete",
      entity: "internal_message",
      entityId: id,
      metadata: {},
    });
    return { deleted: true, id };
  }

  private async listWithWhere(where: Prisma.InternalMessageWhereInput, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.internalMessage.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: this.includeUsers() }),
      this.prisma.internalMessage.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  private buildWhere(params: { search?: string; status?: string }, base: Prisma.InternalMessageWhereInput) {
    const where: Prisma.InternalMessageWhereInput = { ...base, deletedAt: null };
    if (params.status) where.status = params.status as never;
    if (params.search) {
      where.OR = [
        { subject: { contains: params.search, mode: "insensitive" } },
        { body: { contains: params.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private includeUsers() {
    return {
      sender: { select: { id: true, email: true, name: true } },
      recipient: { select: { id: true, email: true, name: true } },
      readBy: { select: { id: true, email: true, name: true } },
    };
  }
}
