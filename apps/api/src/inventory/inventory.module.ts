import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { InventoryPdfService } from "./inventory-pdf.service";
import { DatabaseModule } from "../database/database.module";
import { AuditModule } from "../audit/audit.module";
import { PdfModule } from "../pdf/pdf.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [DatabaseModule, AuditModule, PdfModule, AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryPdfService],
  exports: [InventoryService],
})
export class InventoryModule {}
