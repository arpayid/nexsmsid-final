import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { TeacherPortalController } from "./teacher-portal.controller";
import { TeacherPortalService } from "./teacher-portal.service";

@Module({
  imports: [AuthModule],
  controllers: [TeacherPortalController],
  providers: [TeacherPortalService],
  exports: [TeacherPortalService],
})
export class TeacherPortalModule {}
