import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AnnouncementsController, PublicAnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule, NotificationsModule],
  controllers: [AnnouncementsController, PublicAnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
