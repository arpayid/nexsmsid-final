import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { GradesController } from "./grades.controller";
import { GradesService } from "./grades.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
