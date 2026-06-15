-- CreateEnum
CREATE TYPE "CounselingPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CounselingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CounselingNoteVisibility" AS ENUM ('PRIVATE', 'COUNSELOR_ONLY', 'HOMEROOM_TEACHER', 'PARENT_VISIBLE');

-- CreateEnum
CREATE TYPE "DisciplineSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DisciplineViolationStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "counseling_cases" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" "CounselingPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "CounselingStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "counseling_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_notes" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "visibility" "CounselingNoteVisibility" NOT NULL DEFAULT 'PRIVATE',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "point" INTEGER NOT NULL,
    "severity" "DisciplineSeverity" NOT NULL DEFAULT 'MEDIUM',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discipline_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_violations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "point" INTEGER NOT NULL,
    "status" "DisciplineViolationStatus" NOT NULL DEFAULT 'DRAFT',
    "confirmed_by_id" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "discipline_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_achievements" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "point" INTEGER NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "awarded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counseling_cases_student_id_idx" ON "counseling_cases"("student_id");

-- CreateIndex
CREATE INDEX "counseling_cases_counselor_id_idx" ON "counseling_cases"("counselor_id");

-- CreateIndex
CREATE INDEX "counseling_cases_status_idx" ON "counseling_cases"("status");

-- CreateIndex
CREATE INDEX "counseling_cases_priority_idx" ON "counseling_cases"("priority");

-- CreateIndex
CREATE INDEX "counseling_cases_category_idx" ON "counseling_cases"("category");

-- CreateIndex
CREATE INDEX "counseling_cases_follow_up_date_idx" ON "counseling_cases"("follow_up_date");

-- CreateIndex
CREATE INDEX "counseling_cases_created_by_id_idx" ON "counseling_cases"("created_by_id");

-- CreateIndex
CREATE INDEX "counseling_cases_deleted_at_idx" ON "counseling_cases"("deleted_at");

-- CreateIndex
CREATE INDEX "counseling_notes_case_id_idx" ON "counseling_notes"("case_id");

-- CreateIndex
CREATE INDEX "counseling_notes_visibility_idx" ON "counseling_notes"("visibility");

-- CreateIndex
CREATE INDEX "counseling_notes_created_by_id_idx" ON "counseling_notes"("created_by_id");

-- CreateIndex
CREATE INDEX "counseling_notes_created_at_idx" ON "counseling_notes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "discipline_rules_code_key" ON "discipline_rules"("code");

-- CreateIndex
CREATE INDEX "discipline_rules_code_idx" ON "discipline_rules"("code");

-- CreateIndex
CREATE INDEX "discipline_rules_severity_idx" ON "discipline_rules"("severity");

-- CreateIndex
CREATE INDEX "discipline_rules_is_active_idx" ON "discipline_rules"("is_active");

-- CreateIndex
CREATE INDEX "discipline_violations_student_id_idx" ON "discipline_violations"("student_id");

-- CreateIndex
CREATE INDEX "discipline_violations_rule_id_idx" ON "discipline_violations"("rule_id");

-- CreateIndex
CREATE INDEX "discipline_violations_reported_by_id_idx" ON "discipline_violations"("reported_by_id");

-- CreateIndex
CREATE INDEX "discipline_violations_status_idx" ON "discipline_violations"("status");

-- CreateIndex
CREATE INDEX "discipline_violations_incident_date_idx" ON "discipline_violations"("incident_date");

-- CreateIndex
CREATE INDEX "discipline_violations_confirmed_by_id_idx" ON "discipline_violations"("confirmed_by_id");

-- CreateIndex
CREATE INDEX "discipline_violations_deleted_at_idx" ON "discipline_violations"("deleted_at");

-- CreateIndex
CREATE INDEX "student_achievements_student_id_idx" ON "student_achievements"("student_id");

-- CreateIndex
CREATE INDEX "student_achievements_category_idx" ON "student_achievements"("category");

-- CreateIndex
CREATE INDEX "student_achievements_awarded_at_idx" ON "student_achievements"("awarded_at");

-- CreateIndex
CREATE INDEX "student_achievements_awarded_by_id_idx" ON "student_achievements"("awarded_by_id");

-- CreateIndex
CREATE INDEX "student_achievements_deleted_at_idx" ON "student_achievements"("deleted_at");

-- AddForeignKey
ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_notes" ADD CONSTRAINT "counseling_notes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "counseling_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_notes" ADD CONSTRAINT "counseling_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_violations" ADD CONSTRAINT "discipline_violations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_violations" ADD CONSTRAINT "discipline_violations_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "discipline_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_violations" ADD CONSTRAINT "discipline_violations_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_violations" ADD CONSTRAINT "discipline_violations_confirmed_by_id_fkey" FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_awarded_by_id_fkey" FOREIGN KEY ("awarded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
