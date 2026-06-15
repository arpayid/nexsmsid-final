import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { ExportHistoryController } from "./export-history.controller";
import { ExportHistoryService } from "./export-history.service";

@Module({ imports: [AuthModule, DatabaseModule], controllers: [ExportHistoryController], providers: [ExportHistoryService] })
export class ExportHistoryModule {}
