import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LessonHoursController } from "./lesson-hours.controller";
import { LessonHoursService } from "./lesson-hours.service";

@Module({
  imports: [AuthModule],
  controllers: [LessonHoursController],
  providers: [LessonHoursService],
})
export class LessonHoursModule {}
