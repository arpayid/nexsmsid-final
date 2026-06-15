import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PpdbDashboardController } from "./ppdb-dashboard.controller";
import { PpdbDashboardService } from "./ppdb-dashboard.service";

@Module({
  imports: [AuthModule],
  controllers: [PpdbDashboardController],
  providers: [PpdbDashboardService],
})
export class PpdbDashboardModule {}
