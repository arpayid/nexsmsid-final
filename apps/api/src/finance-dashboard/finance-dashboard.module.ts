import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FinanceDashboardController } from "./finance-dashboard.controller";
import { FinanceDashboardService } from "./finance-dashboard.service";

@Module({
  imports: [AuthModule],
  controllers: [FinanceDashboardController],
  providers: [FinanceDashboardService],
})
export class FinanceDashboardModule {}
