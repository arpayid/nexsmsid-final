import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { TracerStudiesController } from "./tracer-studies.controller";
import { TracerStudiesService } from "./tracer-studies.service";

@Module({ imports: [AuthModule, DatabaseModule, AuditModule], controllers: [TracerStudiesController], providers: [TracerStudiesService] })
export class TracerStudiesModule {}
