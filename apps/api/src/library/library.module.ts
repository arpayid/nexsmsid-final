import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { AuditModule } from "../audit/audit.module";
import { PdfModule } from "../pdf/pdf.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LibraryController } from "./library.controller";
import { LibraryService } from "./library.service";
import { LibraryPdfService } from "./library-pdf.service";
import { LibraryReportService } from "./library-report.service";

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule, PdfModule, NotificationsModule],
  controllers: [LibraryController],
  providers: [LibraryService, LibraryPdfService, LibraryReportService],
  exports: [LibraryService],
})
export class LibraryModule {}
