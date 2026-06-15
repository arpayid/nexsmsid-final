import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DisciplineModule } from "../discipline/discipline.module";
import { StudentPortalController } from "./student-portal.controller";
import { StudentPortalService } from "./student-portal.service";

@Module({
  imports: [AuthModule, DisciplineModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService],
  exports: [StudentPortalService],
})
export class StudentPortalModule {}
