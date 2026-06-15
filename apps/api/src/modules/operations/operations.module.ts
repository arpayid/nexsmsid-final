import { Module } from "@nestjs/common";
import { ExamsModule } from "../../exams/exams.module";
import { HRModule } from "../../hr/hr.module";
import { InventoryModule } from "../../inventory/inventory.module";
import { LibraryModule } from "../../library/library.module";
import { PayrollModule } from "../../payroll/payroll.module";

@Module({
  imports: [InventoryModule, LibraryModule, HRModule, PayrollModule, ExamsModule],
  exports: [InventoryModule, LibraryModule, HRModule, PayrollModule, ExamsModule],
})
export class OperationsModule {}
