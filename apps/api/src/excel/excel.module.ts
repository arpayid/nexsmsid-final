import { Global, Module } from "@nestjs/common";

import { ExcelImportService } from "./excel-import.service";
import { ExcelService } from "./excel.service";

@Global()
@Module({
  providers: [ExcelService, ExcelImportService],
  exports: [ExcelService, ExcelImportService],
})
export class ExcelModule {}
