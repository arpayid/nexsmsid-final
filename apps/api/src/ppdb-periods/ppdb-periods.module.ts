import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PpdbPeriodsController } from "./ppdb-periods.controller";
import { PpdbPeriodsService } from "./ppdb-periods.service";

@Module({
  imports: [AuthModule],
  controllers: [PpdbPeriodsController],
  providers: [PpdbPeriodsService],
})
export class PpdbPeriodsModule {}
