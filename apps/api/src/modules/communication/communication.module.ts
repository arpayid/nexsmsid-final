import { Module } from "@nestjs/common";
import { AnnouncementsModule } from "../../announcements/announcements.module";
import { InternalMessagesModule } from "../../internal-messages/internal-messages.module";
import { NotificationTemplatesModule } from "../../notification-templates/notification-templates.module";
import { NotificationsModule } from "../../notifications/notifications.module";

@Module({
  imports: [AnnouncementsModule, InternalMessagesModule, NotificationsModule, NotificationTemplatesModule],
  exports: [AnnouncementsModule, InternalMessagesModule, NotificationsModule, NotificationTemplatesModule],
})
export class CommunicationModule {}
