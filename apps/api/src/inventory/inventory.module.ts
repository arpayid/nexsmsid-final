import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryItemsService } from "./inventory-items.service";
import { InventoryLoansService } from "./inventory-loans.service";
import { InventoryStockService } from "./inventory-stock.service";
import { InventoryPdfService } from "./inventory-pdf.service";
import { DatabaseModule } from "../database/database.module";
import { AuditModule } from "../audit/audit.module";
import { PdfModule } from "../pdf/pdf.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [DatabaseModule, AuditModule, PdfModule, AuthModule],
  controllers: [InventoryController],
  providers: [InventoryItemsService, InventoryLoansService, InventoryStockService, InventoryPdfService],
  exports: [InventoryItemsService, InventoryLoansService, InventoryStockService],
})
export class InventoryModule {}
