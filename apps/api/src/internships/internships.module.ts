import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { InternshipsController } from "./internships.controller";
import { InternshipsService } from "./internships.service";

@Module({ imports: [AuthModule, DatabaseModule, AuditModule], controllers: [InternshipsController], providers: [InternshipsService] })
export class InternshipsModule {}
