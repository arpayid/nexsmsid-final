import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { DisciplineController } from "./discipline.controller";
import { DisciplineService } from "./discipline.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [DisciplineController],
  providers: [DisciplineService],
  exports: [DisciplineService],
})
export class DisciplineModule {}
