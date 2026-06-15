-- CreateEnum
CREATE TYPE "LetterDirection" AS ENUM ('INCOMING', 'OUTGOING', 'INTERNAL');

-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ISSUED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LetterPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "LetterRecipientType" AS ENUM ('STUDENT', 'GUARDIAN', 'TEACHER', 'STAFF', 'USER', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "LetterTemplateStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LetterApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "letter_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" "LetterTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "subject_template" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "variables" JSONB,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "letter_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letters" (
    "id" TEXT NOT NULL,
    "template_id" TEXT,
    "letter_number" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "direction" "LetterDirection" NOT NULL DEFAULT 'OUTGOING',
    "status" "LetterStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "LetterPriority" NOT NULL DEFAULT 'NORMAL',
    "category" TEXT NOT NULL,
    "recipient_type" "LetterRecipientType" NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "recipient_email" TEXT,
    "recipient_address" TEXT,
    "student_id" TEXT,
    "guardian_id" TEXT,
    "teacher_id" TEXT,
    "staff_id" TEXT,
    "related_counseling_case_id" TEXT,
    "related_discipline_violation_id" TEXT,
    "issued_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "approved_by_id" TEXT,
    "rejected_by_id" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_approvals" (
    "id" TEXT NOT NULL,
    "letter_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" "LetterApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_attachments" (
    "id" TEXT NOT NULL,
    "letter_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letter_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_number_sequences" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "current_number" INTEGER NOT NULL DEFAULT 0,
    "format" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "letter_templates_code_key" ON "letter_templates"("code");

-- CreateIndex
CREATE INDEX "letter_templates_code_idx" ON "letter_templates"("code");

-- CreateIndex
CREATE INDEX "letter_templates_category_idx" ON "letter_templates"("category");

-- CreateIndex
CREATE INDEX "letter_templates_status_idx" ON "letter_templates"("status");

-- CreateIndex
CREATE INDEX "letter_templates_created_by_id_idx" ON "letter_templates"("created_by_id");

-- CreateIndex
CREATE INDEX "letter_templates_deleted_at_idx" ON "letter_templates"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "letters_letter_number_key" ON "letters"("letter_number");

-- CreateIndex
CREATE INDEX "letters_letter_number_idx" ON "letters"("letter_number");

-- CreateIndex
CREATE INDEX "letters_status_idx" ON "letters"("status");

-- CreateIndex
CREATE INDEX "letters_direction_idx" ON "letters"("direction");

-- CreateIndex
CREATE INDEX "letters_category_idx" ON "letters"("category");

-- CreateIndex
CREATE INDEX "letters_recipient_type_idx" ON "letters"("recipient_type");

-- CreateIndex
CREATE INDEX "letters_student_id_idx" ON "letters"("student_id");

-- CreateIndex
CREATE INDEX "letters_guardian_id_idx" ON "letters"("guardian_id");

-- CreateIndex
CREATE INDEX "letters_teacher_id_idx" ON "letters"("teacher_id");

-- CreateIndex
CREATE INDEX "letters_staff_id_idx" ON "letters"("staff_id");

-- CreateIndex
CREATE INDEX "letters_created_by_id_idx" ON "letters"("created_by_id");

-- CreateIndex
CREATE INDEX "letters_approved_by_id_idx" ON "letters"("approved_by_id");

-- CreateIndex
CREATE INDEX "letters_issued_at_idx" ON "letters"("issued_at");

-- CreateIndex
CREATE INDEX "letters_created_at_idx" ON "letters"("created_at");

-- CreateIndex
CREATE INDEX "letters_deleted_at_idx" ON "letters"("deleted_at");

-- CreateIndex
CREATE INDEX "letter_approvals_letter_id_idx" ON "letter_approvals"("letter_id");

-- CreateIndex
CREATE INDEX "letter_approvals_approver_id_idx" ON "letter_approvals"("approver_id");

-- CreateIndex
CREATE INDEX "letter_approvals_status_idx" ON "letter_approvals"("status");

-- CreateIndex
CREATE INDEX "letter_approvals_created_at_idx" ON "letter_approvals"("created_at");

-- CreateIndex
CREATE INDEX "letter_attachments_letter_id_idx" ON "letter_attachments"("letter_id");

-- CreateIndex
CREATE INDEX "letter_attachments_uploaded_by_id_idx" ON "letter_attachments"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "letter_attachments_created_at_idx" ON "letter_attachments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "letter_number_sequences_category_year_month_key" ON "letter_number_sequences"("category", "year", "month");

-- AddForeignKey
ALTER TABLE "letter_templates" ADD CONSTRAINT "letter_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_templates" ADD CONSTRAINT "letter_templates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "letter_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_related_counseling_case_id_fkey" FOREIGN KEY ("related_counseling_case_id") REFERENCES "counseling_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_related_discipline_violation_id_fkey" FOREIGN KEY ("related_discipline_violation_id") REFERENCES "discipline_violations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_approvals" ADD CONSTRAINT "letter_approvals_letter_id_fkey" FOREIGN KEY ("letter_id") REFERENCES "letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_approvals" ADD CONSTRAINT "letter_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_attachments" ADD CONSTRAINT "letter_attachments_letter_id_fkey" FOREIGN KEY ("letter_id") REFERENCES "letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_attachments" ADD CONSTRAINT "letter_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
