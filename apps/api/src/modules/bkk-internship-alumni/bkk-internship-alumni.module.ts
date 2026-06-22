import { Module } from "@nestjs/common";
import { AlumniModule } from "../../alumni/alumni.module";
import { BkkDashboardModule } from "../../bkk-dashboard/bkk-dashboard.module";
import { JobVacanciesModule } from "../../job-vacancies/job-vacancies.module";
import { JobApplicationsModule } from "../../job-applications/job-applications.module";
import { TracerStudiesModule } from "../../tracer-studies/tracer-studies.module";
import { InternshipsModule } from "../../internships/internships.module";
import { InternshipLogsModule } from "../../internship-logs/internship-logs.module";
import { IndustryPartnersModule } from "../../industry-partners/industry-partners.module";

@Module({
  imports: [
    AlumniModule,
    BkkDashboardModule,
    JobVacanciesModule,
    JobApplicationsModule,
    TracerStudiesModule,
    InternshipsModule,
    InternshipLogsModule,
    IndustryPartnersModule,
  ],
  exports: [
    AlumniModule,
    BkkDashboardModule,
    JobVacanciesModule,
    JobApplicationsModule,
    TracerStudiesModule,
    InternshipsModule,
    InternshipLogsModule,
    IndustryPartnersModule,
  ],
})
export class BkkInternshipAlumniModule {}
