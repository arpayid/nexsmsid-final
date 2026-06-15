import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { ExcelModule } from "../excel/excel.module";
import { PdfModule } from "../pdf/pdf.module";
import { ReportRegistryService } from "./report-registry.service";
import { ReportDataService } from "./report-data.service";
import { ReportRendererService } from "./report-renderer.service";
import { ReportFilterValidationService } from "./report-filter-validation.service";

@Module({
  imports: [DatabaseModule, ExcelModule, PdfModule],
  providers: [ReportRegistryService, ReportDataService, ReportRendererService, ReportFilterValidationService],
  exports: [ReportRegistryService, ReportDataService, ReportRendererService, ReportFilterValidationService],
})
export class ReportEngineModule {}
