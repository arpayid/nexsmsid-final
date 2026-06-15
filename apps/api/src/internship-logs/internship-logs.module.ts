import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { InternshipLogsController } from "./internship-logs.controller";
import { InternshipLogsService } from "./internship-logs.service";

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule, NotificationsModule],
  controllers: [InternshipLogsController],
  providers: [InternshipLogsService],
})
export class InternshipLogsModule {}
