import { Module } from "@nestjs/common";
import { HRController } from "./hr.controller";
import { HRService } from "./hr.service";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuthModule, DatabaseModule, NotificationsModule, AuditModule],
  controllers: [HRController],
  providers: [HRService],
  exports: [HRService],
})
export class HRModule {}
