import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";
import { ExamPdfService } from "./exam-pdf.service";
import { ExamReportService } from "./exam-report.service";

@Module({
  imports: [AuthModule, DatabaseModule, NotificationsModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamPdfService, ExamReportService],
  exports: [ExamsService, ExamPdfService, ExamReportService],
})
export class ExamsModule {}
