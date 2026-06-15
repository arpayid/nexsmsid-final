import { Module } from "@nestjs/common";
import { ExcelModule } from "../../excel/excel.module";
import { ExportHistoryModule } from "../../export-history/export-history.module";
import { PdfModule } from "../../pdf/pdf.module";
import { ReportCenterModule } from "../../report-center/report-center.module";
import { ReportJobsModule } from "../../report-jobs/report-jobs.module";

@Module({
  imports: [ReportCenterModule, ReportJobsModule, ExportHistoryModule, PdfModule, ExcelModule],
  exports: [ReportCenterModule, ReportJobsModule, ExportHistoryModule, PdfModule, ExcelModule],
})
export class ReportingModule {}
