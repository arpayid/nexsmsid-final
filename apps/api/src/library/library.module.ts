import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { AuditModule } from "../audit/audit.module";
import { PdfModule } from "../pdf/pdf.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LibraryController } from "./library.controller";
import { LibraryCatalogService } from "./library-catalog.service";
import { LibraryCirculationService } from "./library-circulation.service";
import { LibraryFinesService } from "./library-fines.service";
import { LibraryMembersService } from "./library-members.service";
import { LibraryDashboardService } from "./library-dashboard.service";
import { LibraryPdfService } from "./library-pdf.service";

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule, PdfModule, NotificationsModule],
  controllers: [LibraryController],
  providers: [
    LibraryCatalogService,
    LibraryCirculationService,
    LibraryFinesService,
    LibraryMembersService,
    LibraryDashboardService,
    LibraryPdfService,
  ],
  exports: [LibraryCatalogService, LibraryCirculationService, LibraryFinesService, LibraryMembersService, LibraryDashboardService],
})
export class LibraryModule {}
