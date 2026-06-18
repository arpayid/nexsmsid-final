import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PortalProvisioningModule } from "../portal-provisioning/portal-provisioning.module";
import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";

@Module({
  imports: [AuthModule, PortalProvisioningModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
