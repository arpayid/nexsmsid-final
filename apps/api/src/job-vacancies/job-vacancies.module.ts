import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { JobCvUploadTokenService } from "./job-cv-upload-token.service";
import { JobVacanciesController, PublicJobsController } from "./job-vacancies.controller";
import { JobVacanciesService } from "./job-vacancies.service";

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule],
  controllers: [JobVacanciesController, PublicJobsController],
  providers: [JobVacanciesService, JobCvUploadTokenService],
})
export class JobVacanciesModule {}
