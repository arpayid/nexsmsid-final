import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { MailerModule } from "./mailer.module";
import { NotificationDispatchService } from "./notification-dispatch.service";
import { NotificationEventService } from "./notification-event.service";
import { NotificationRecipientResolverService } from "./notification-recipient-resolver.service";
import { NotificationTemplateRenderService } from "./notification-template-render.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { WhatsAppModule } from "./whatsapp.module";

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule, MailerModule, WhatsAppModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatchService,
    NotificationEventService,
    NotificationRecipientResolverService,
    NotificationTemplateRenderService,
  ],
  exports: [
    NotificationsService,
    NotificationDispatchService,
    NotificationEventService,
    NotificationRecipientResolverService,
    NotificationTemplateRenderService,
  ],
})
export class NotificationsModule {}
