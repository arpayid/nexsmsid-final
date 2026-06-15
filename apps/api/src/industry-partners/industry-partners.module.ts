import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { IndustryPartnersController } from "./industry-partners.controller";
import { IndustryPartnersService } from "./industry-partners.service";

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule],
  controllers: [IndustryPartnersController],
  providers: [IndustryPartnersService],
})
export class IndustryPartnersModule {}
