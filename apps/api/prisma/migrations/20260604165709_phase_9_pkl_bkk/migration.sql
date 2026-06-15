-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InternshipStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InternshipLogStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AlumniStatus" AS ENUM ('ACTIVE', 'WORKING', 'STUDYING', 'ENTREPRENEUR', 'UNEMPLOYED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "industry_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "industry_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internships" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "industry_partner_id" TEXT NOT NULL,
    "supervisor_teacher_id" TEXT,
    "title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "InternshipStatus" NOT NULL DEFAULT 'PLANNED',
    "final_score" DECIMAL(65,30),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "internships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_logs" (
    "id" TEXT NOT NULL,
    "internship_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activity" TEXT NOT NULL,
    "obstacle" TEXT,
    "solution" TEXT,
    "status" "InternshipLogStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_scores" (
    "id" TEXT NOT NULL,
    "internship_id" TEXT NOT NULL,
    "discipline_score" INTEGER NOT NULL,
    "skill_score" INTEGER NOT NULL,
    "attitude_score" INTEGER NOT NULL,
    "report_score" INTEGER NOT NULL,
    "final_score" DECIMAL(65,30) NOT NULL,
    "assessed_by_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "student_id" TEXT,
    "nis" TEXT,
    "name" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" "AlumniStatus" NOT NULL DEFAULT 'UNKNOWN',
    "current_company" TEXT,
    "current_position" TEXT,
    "university" TEXT,
    "business_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_vacancies" (
    "id" TEXT NOT NULL,
    "industry_partner_id" TEXT,
    "title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qualification" TEXT,
    "location" TEXT,
    "employment_type" TEXT,
    "salary_range" TEXT,
    "deadline" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "job_vacancy_id" TEXT NOT NULL,
    "alumni_id" TEXT,
    "applicant_name" TEXT NOT NULL,
    "applicant_email" TEXT,
    "applicant_phone" TEXT,
    "cv_url" TEXT,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracer_studies" (
    "id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "AlumniStatus" NOT NULL DEFAULT 'UNKNOWN',
    "company_name" TEXT,
    "position" TEXT,
    "university" TEXT,
    "major" TEXT,
    "business_name" TEXT,
    "income_range" TEXT,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracer_studies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "industry_partners_status_idx" ON "industry_partners"("status");

-- CreateIndex
CREATE INDEX "industry_partners_deleted_at_idx" ON "industry_partners"("deleted_at");

-- CreateIndex
CREATE INDEX "industry_partners_name_idx" ON "industry_partners"("name");

-- CreateIndex
CREATE INDEX "internships_student_id_idx" ON "internships"("student_id");

-- CreateIndex
CREATE INDEX "internships_industry_partner_id_idx" ON "internships"("industry_partner_id");

-- CreateIndex
CREATE INDEX "internships_supervisor_teacher_id_idx" ON "internships"("supervisor_teacher_id");

-- CreateIndex
CREATE INDEX "internships_status_idx" ON "internships"("status");

-- CreateIndex
CREATE INDEX "internships_deleted_at_idx" ON "internships"("deleted_at");

-- CreateIndex
CREATE INDEX "internship_logs_internship_id_idx" ON "internship_logs"("internship_id");

-- CreateIndex
CREATE INDEX "internship_logs_status_idx" ON "internship_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "internship_scores_internship_id_key" ON "internship_scores"("internship_id");

-- CreateIndex
CREATE INDEX "internship_scores_assessed_by_id_idx" ON "internship_scores"("assessed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_student_id_key" ON "alumni"("student_id");

-- CreateIndex
CREATE INDEX "alumni_status_idx" ON "alumni"("status");

-- CreateIndex
CREATE INDEX "alumni_graduation_year_idx" ON "alumni"("graduation_year");

-- CreateIndex
CREATE INDEX "alumni_deleted_at_idx" ON "alumni"("deleted_at");

-- CreateIndex
CREATE INDEX "alumni_name_idx" ON "alumni"("name");

-- CreateIndex
CREATE INDEX "job_vacancies_industry_partner_id_idx" ON "job_vacancies"("industry_partner_id");

-- CreateIndex
CREATE INDEX "job_vacancies_status_idx" ON "job_vacancies"("status");

-- CreateIndex
CREATE INDEX "job_vacancies_deleted_at_idx" ON "job_vacancies"("deleted_at");

-- CreateIndex
CREATE INDEX "job_vacancies_deadline_idx" ON "job_vacancies"("deadline");

-- CreateIndex
CREATE INDEX "job_applications_job_vacancy_id_idx" ON "job_applications"("job_vacancy_id");

-- CreateIndex
CREATE INDEX "job_applications_alumni_id_idx" ON "job_applications"("alumni_id");

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_vacancy_id_applicant_email_key" ON "job_applications"("job_vacancy_id", "applicant_email");

-- CreateIndex
CREATE INDEX "tracer_studies_alumni_id_idx" ON "tracer_studies"("alumni_id");

-- CreateIndex
CREATE INDEX "tracer_studies_year_idx" ON "tracer_studies"("year");

-- CreateIndex
CREATE INDEX "tracer_studies_status_idx" ON "tracer_studies"("status");

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_industry_partner_id_fkey" FOREIGN KEY ("industry_partner_id") REFERENCES "industry_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_supervisor_teacher_id_fkey" FOREIGN KEY ("supervisor_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_logs" ADD CONSTRAINT "internship_logs_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_logs" ADD CONSTRAINT "internship_logs_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_scores" ADD CONSTRAINT "internship_scores_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_scores" ADD CONSTRAINT "internship_scores_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_industry_partner_id_fkey" FOREIGN KEY ("industry_partner_id") REFERENCES "industry_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_vacancy_id_fkey" FOREIGN KEY ("job_vacancy_id") REFERENCES "job_vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracer_studies" ADD CONSTRAINT "tracer_studies_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
