import { Module } from "@nestjs/common";
import { PpdbDashboardModule } from "../../ppdb-dashboard/ppdb-dashboard.module";
import { PpdbPeriodsModule } from "../../ppdb-periods/ppdb-periods.module";
import { PpdbRegistrationsModule } from "../../ppdb-registrations/ppdb-registrations.module";
import { PublicPpdbModule } from "../../public-ppdb/public-ppdb.module";

@Module({
  imports: [PpdbPeriodsModule, PpdbRegistrationsModule, PublicPpdbModule, PpdbDashboardModule],
  exports: [PpdbPeriodsModule, PpdbRegistrationsModule, PublicPpdbModule, PpdbDashboardModule],
})
export class PPDBModule {}
