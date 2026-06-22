import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { ExcelModule } from "../excel/excel.module";
import { PdfModule } from "../pdf/pdf.module";
import { ReportRegistryService } from "./report-registry.service";
import { ReportDataService } from "./report-data.service";
import { ReportRendererService } from "./report-renderer.service";
import { ReportFilterValidationService } from "./report-filter-validation.service";
import { AcademicReportProvider } from "./providers/academic.report-provider";
import { FinanceReportProvider } from "./providers/finance.report-provider";
import { HrPayrollReportProvider } from "./providers/hr-payroll.report-provider";
import { InventoryLibraryReportProvider } from "./providers/inventory-library.report-provider";
import { CommunicationReportProvider } from "./providers/communication.report-provider";

@Module({
  imports: [DatabaseModule, ExcelModule, PdfModule],
  providers: [
    ReportRegistryService,
    ReportDataService,
    ReportRendererService,
    ReportFilterValidationService,
    AcademicReportProvider,
    FinanceReportProvider,
    HrPayrollReportProvider,
    InventoryLibraryReportProvider,
    CommunicationReportProvider,
  ],
  exports: [ReportRegistryService, ReportDataService, ReportRendererService, ReportFilterValidationService],
})
export class ReportEngineModule {}
