import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CounselingController } from "./counseling.controller";
import { CounselingService } from "./counseling.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [CounselingController],
  providers: [CounselingService],
})
export class CounselingModule {}
