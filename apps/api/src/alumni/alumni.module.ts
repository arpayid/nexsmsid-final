import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { AlumniController } from "./alumni.controller";
import { AlumniService } from "./alumni.service";

@Module({ imports: [AuthModule, DatabaseModule, AuditModule], controllers: [AlumniController], providers: [AlumniService] })
export class AlumniModule {}
