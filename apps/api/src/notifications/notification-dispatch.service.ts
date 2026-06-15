import { Inject, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { escapeHtml } from "../common/escape-html";
import { RequestMeta } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { EventsGateway } from "../events/events.gateway";
import { MailerService } from "./mailer.service";
import { WhatsAppService } from "./whatsapp.service";

export type NotificationChannel = "IN_APP" | "EMAIL" | "WHATSAPP";

export type NotificationDispatchPayload = {
  action: string;
  body: string;
  entityId: string;
  entityType: string;
  title: string;
  type: string;
  url?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  channels?: NotificationChannel[];
};

export type NotificationDispatchAudit = RequestMeta & {
  action: string;
  actorId?: string | null;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(EventsGateway) private readonly eventsGateway: EventsGateway,
    @Inject(MailerService) private readonly mailerService: MailerService,
    @Inject(WhatsAppService) private readonly whatsAppService: WhatsAppService,
  ) {}

  async notifyUsers(userIds: string[], payload: NotificationDispatchPayload, audit: NotificationDispatchAudit) {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    if (!uniqueUserIds.length) {
      await this.auditService.record({
        ...audit,
        metadata: { ...(audit.metadata ?? {}), requested: userIds.length, recipients: 0, created: 0, skipped: 0 },
      });
      return { requested: userIds.length, recipients: 0, created: 0, skipped: 0 };
    }

    const activeUsers = await this.prisma.user.findMany({
      where: { id: { in: uniqueUserIds }, deletedAt: null, status: "ACTIVE" },
      select: { id: true, email: true },
    });

    const channels: NotificationChannel[] = payload.channels?.length ? [...payload.channels] : ["IN_APP"];

    let created = 0;
    let skipped = 0;
    const metadata = {
      ...(payload.metadata ?? {}),
      action: payload.action,
      dedupeKey: payload.dedupeKey ?? null,
      entityId: payload.entityId,
      entityType: payload.entityType,
      type: payload.type,
      url: payload.url ?? null,
    };

    for (const user of activeUsers) {
      if (payload.dedupeKey) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: user.id,
            metadata: { path: ["dedupeKey"], equals: payload.dedupeKey },
          },
        });
        if (existing) {
          skipped += 1;
          continue;
        }
      }

      const notification = await this.prisma.notification.create({
        data: {
          userId: user.id,
          title: payload.title,
          body: payload.body,
          channel: channels.includes("EMAIL") ? "EMAIL" : channels.includes("WHATSAPP") ? "WHATSAPP" : "IN_APP",
          status: "UNREAD",
          metadata: metadata as Prisma.InputJsonValue,
        },
      });
      created += 1;

      if (channels.includes("IN_APP")) {
        this.eventsGateway.sendToUser(user.id, "notification", {
          id: notification.id,
          title: payload.title,
          body: payload.body,
          type: payload.type,
          status: "UNREAD",
          createdAt: notification.createdAt.toISOString(),
        });
      }

      if (channels.includes("EMAIL") && user.email) {
        void this.mailerService
          .send({
            to: user.email,
            subject: escapeHtml(payload.title),
            html: `<p>${escapeHtml(payload.body)}</p>`,
          })
          .catch((error) => {
            this.logger.warn(
              `Failed to send email notification to ${user.email}: ${error instanceof Error ? error.message : String(error)}`,
              error instanceof Error ? error.stack : undefined,
            );
          });
      }

      if (channels.includes("WHATSAPP")) {
        const phone = await this.resolveUserPhone(user.id);
        if (phone) {
          void this.whatsAppService.send({ to: phone, message: `${payload.title}\n\n${payload.body}` }).catch((error) => {
            this.logger.warn(
              `Failed to send WhatsApp notification to ${phone}: ${error instanceof Error ? error.message : String(error)}`,
              error instanceof Error ? error.stack : undefined,
            );
          });
        }
      }
    }

    await this.auditService.record({
      ...audit,
      metadata: {
        ...(audit.metadata ?? {}),
        created,
        recipients: activeUsers.length,
        requested: userIds.length,
        skipped,
        type: payload.type,
      } as Prisma.InputJsonValue,
    });

    return { requested: userIds.length, recipients: activeUsers.length, created, skipped };
  }

  private async resolveUserPhone(userId: string): Promise<string | null> {
    const [student, teacher, guardian, employeeProfile] = await Promise.all([
      this.prisma.student.findFirst({ where: { userId, deletedAt: null }, select: { phone: true } }),
      this.prisma.teacher.findFirst({ where: { userId, deletedAt: null }, select: { phone: true } }),
      this.prisma.guardian.findFirst({ where: { userId }, select: { phone: true } }),
      this.prisma.employeeProfile.findFirst({
        where: { userId },
        select: { staff: { select: { phone: true } }, teacher: { select: { phone: true } } },
      }),
    ]);

    return student?.phone ?? teacher?.phone ?? guardian?.phone ?? employeeProfile?.staff?.phone ?? employeeProfile?.teacher?.phone ?? null;
  }
}
