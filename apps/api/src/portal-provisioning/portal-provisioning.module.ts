import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { MailerModule } from "../notifications/mailer.module";
import { PortalProvisioningService } from "./portal-provisioning.service";

@Module({
  imports: [AuthModule, AuditModule, MailerModule],
  providers: [PortalProvisioningService],
  exports: [PortalProvisioningService],
})
export class PortalProvisioningModule {}
