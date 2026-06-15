import { Module } from "@nestjs/common";
import { PayrollController } from "./payroll.controller";
import { PayrollService } from "./payroll.service";
import { PayrollCalculationService } from "./payroll-calculation.service";
import { PayrollPdfService } from "./payroll-pdf.service";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuditModule } from "../audit/audit.module";
import { PdfModule } from "../pdf/pdf.module";

@Module({
  imports: [AuthModule, DatabaseModule, NotificationsModule, AuditModule, PdfModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollCalculationService, PayrollPdfService],
  exports: [PayrollService],
})
export class PayrollModule {}
