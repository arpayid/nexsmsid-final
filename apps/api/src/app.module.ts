import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AlumniModule } from "./alumni/alumni.module";
import { AppController } from "./app.controller";
import { AcademicModule } from "./modules/academic/academic.module";
import { BkkDashboardModule } from "./bkk-dashboard/bkk-dashboard.module";
import { CommunicationModule } from "./modules/communication/communication.module";
import { AppConfigModule } from "./config/app-config.module";
import { CaptchaModule } from "./common/captcha/captcha.module";
import { CounselingModule } from "./counseling/counseling.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { DisciplineModule } from "./discipline/discipline.module";
import { EventsModule } from "./events/events.module";
import { GuardianPortalModule } from "./guardian-portal/guardian-portal.module";
import { HealthModule } from "./health/health.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { PeopleModule } from "./modules/people/people.module";
import { PPDBModule } from "./modules/ppdb/ppdb.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { SchoolModule } from "./modules/school/school.module";
import { IndustryPartnersModule } from "./industry-partners/industry-partners.module";
import { InternshipLogsModule } from "./internship-logs/internship-logs.module";
import { InternshipsModule } from "./internships/internships.module";
import { JobApplicationsModule } from "./job-applications/job-applications.module";
import { JobVacanciesModule } from "./job-vacancies/job-vacancies.module";
import { LettersModule } from "./letters/letters.module";
import { MailerModule } from "./notifications/mailer.module";
import { StudentPortalModule } from "./student-portal/student-portal.module";
import { TeacherPortalModule } from "./teacher-portal/teacher-portal.module";
import { TracerStudiesModule } from "./tracer-studies/tracer-studies.module";
import { WhatsAppModule } from "./notifications/whatsapp.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionGuard } from "./auth/guards/permission.guard";

@Module({
  imports: [
    AppConfigModule,
    CaptchaModule,
    DatabaseModule,
    IdentityModule,
    DashboardModule,
    HealthModule,
    SchoolModule,
    PeopleModule,
    AcademicModule,
    CommunicationModule,
    FinanceModule,
    OperationsModule,
    PPDBModule,
    ReportingModule,
    LettersModule,
    MailerModule,
    IndustryPartnersModule,
    InternshipsModule,
    InternshipLogsModule,
    AlumniModule,
    JobVacanciesModule,
    JobApplicationsModule,
    TracerStudiesModule,
    BkkDashboardModule,
    CounselingModule,
    DisciplineModule,
    EventsModule,
    TeacherPortalModule,
    StudentPortalModule,
    GuardianPortalModule,
    WhatsAppModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>("RATE_LIMIT_TTL") ?? 60,
          limit: config.get<number>("RATE_LIMIT_LIMIT") ?? 100,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
