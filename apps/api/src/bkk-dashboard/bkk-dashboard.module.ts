import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { BkkDashboardController } from "./bkk-dashboard.controller";
import { BkkDashboardService } from "./bkk-dashboard.service";

@Module({ imports: [AuthModule, DatabaseModule], controllers: [BkkDashboardController], providers: [BkkDashboardService] })
export class BkkDashboardModule {}
