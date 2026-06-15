import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

export type RenderedNotificationTemplate = {
  subject: string;
  body: string;
  channel: string;
};

@Injectable()
export class NotificationTemplateRenderService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async render(code: string, vars: Record<string, string>): Promise<RenderedNotificationTemplate | null> {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { code, isActive: true, deletedAt: null },
    });

    if (!template) {
      return null;
    }

    return {
      subject: this.interpolate(template.subject ?? "", vars),
      body: this.interpolate(template.body, vars),
      channel: template.channel,
    };
  }

  private interpolate(text: string, vars: Record<string, string>) {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
  }
}
