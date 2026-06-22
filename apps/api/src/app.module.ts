import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { AcademicModule } from "./modules/academic/academic.module";
import { BkkInternshipAlumniModule } from "./modules/bkk-internship-alumni/bkk-internship-alumni.module";
import { CommunicationModule } from "./modules/communication/communication.module";
import { CounselingDisciplineModule } from "./modules/counseling-discipline/counseling-discipline.module";
import { AppConfigModule } from "./config/app-config.module";
import { CaptchaModule } from "./common/captcha/captcha.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
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
import { LettersModule } from "./letters/letters.module";
import { MailerModule } from "./notifications/mailer.module";
import { StudentPortalModule } from "./student-portal/student-portal.module";
import { TeacherPortalModule } from "./teacher-portal/teacher-portal.module";
import { WhatsAppModule } from "./notifications/whatsapp.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionGuard } from "./auth/guards/permission.guard";

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>("LOG_LEVEL") ?? "info",
          transport:
            config.get<string>("NODE_ENV") !== "production"
              ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
              : undefined,
        },
      }),
    }),
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
    BkkInternshipAlumniModule,
    CounselingDisciplineModule,
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
