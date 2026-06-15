CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'GRADED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamSessionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamParticipantStatus" AS ENUM ('REGISTERED', 'PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'ESSAY', 'TRUE_FALSE', 'MATCHING', 'SHORT_ANSWER');

-- CreateTable
CREATE TABLE "exam_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "exam_type_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "semester_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "total_questions" INTEGER,
    "max_score" INTEGER,
    "passing_score" INTEGER,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "is_cbt" BOOLEAN NOT NULL DEFAULT false,
    "instruction" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedules" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "room_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "supervisor_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_sessions" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "status" "ExamSessionStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_participants" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "session_id" TEXT,
    "student_id" TEXT NOT NULL,
    "number" INTEGER,
    "status" "ExamParticipantStatus" NOT NULL DEFAULT 'REGISTERED',
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attendances" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "check_in_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_questions" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "bank_id" TEXT,
    "number" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "content" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "attachment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer" TEXT,
    "isCorrect" BOOLEAN,
    "score" DOUBLE PRECISION,
    "graded_at" TIMESTAMP(3),
    "graded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_types_code_key" ON "exam_types"("code");

-- CreateIndex
CREATE INDEX "exam_types_deleted_at_idx" ON "exam_types"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "exams_code_key" ON "exams"("code");

-- CreateIndex
CREATE INDEX "exams_exam_type_id_idx" ON "exams"("exam_type_id");

-- CreateIndex
CREATE INDEX "exams_academic_year_id_idx" ON "exams"("academic_year_id");

-- CreateIndex
CREATE INDEX "exams_semester_id_idx" ON "exams"("semester_id");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "exams_deleted_at_idx" ON "exams"("deleted_at");

-- CreateIndex
CREATE INDEX "exam_schedules_exam_id_idx" ON "exam_schedules"("exam_id");

-- CreateIndex
CREATE INDEX "exam_schedules_room_id_idx" ON "exam_schedules"("room_id");

-- CreateIndex
CREATE INDEX "exam_schedules_date_idx" ON "exam_schedules"("date");

-- CreateIndex
CREATE INDEX "exam_schedules_deleted_at_idx" ON "exam_schedules"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "exam_rooms_code_key" ON "exam_rooms"("code");

-- CreateIndex
CREATE INDEX "exam_rooms_deleted_at_idx" ON "exam_rooms"("deleted_at");

-- CreateIndex
CREATE INDEX "exam_rooms_is_active_idx" ON "exam_rooms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "exam_sessions_code_key" ON "exam_sessions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exam_sessions_token_key" ON "exam_sessions"("token");

-- CreateIndex
CREATE INDEX "exam_sessions_schedule_id_idx" ON "exam_sessions"("schedule_id");

-- CreateIndex
CREATE INDEX "exam_sessions_deleted_at_idx" ON "exam_sessions"("deleted_at");

-- CreateIndex
CREATE INDEX "exam_participants_exam_id_idx" ON "exam_participants"("exam_id");

-- CreateIndex
CREATE INDEX "exam_participants_session_id_idx" ON "exam_participants"("session_id");

-- CreateIndex
CREATE INDEX "exam_participants_student_id_idx" ON "exam_participants"("student_id");

-- CreateIndex
CREATE INDEX "exam_participants_deleted_at_idx" ON "exam_participants"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "exam_participants_exam_id_student_id_key" ON "exam_participants"("exam_id", "student_id");

-- CreateIndex
CREATE INDEX "exam_attendances_session_id_idx" ON "exam_attendances"("session_id");

-- CreateIndex
CREATE INDEX "exam_attendances_participant_id_idx" ON "exam_attendances"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attendances_session_id_participant_id_key" ON "exam_attendances"("session_id", "participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_banks_code_key" ON "question_banks"("code");

-- CreateIndex
CREATE INDEX "question_banks_deleted_at_idx" ON "question_banks"("deleted_at");

-- CreateIndex
CREATE INDEX "exam_questions_exam_id_idx" ON "exam_questions"("exam_id");

-- CreateIndex
CREATE INDEX "exam_questions_bank_id_idx" ON "exam_questions"("bank_id");

-- CreateIndex
CREATE INDEX "exam_questions_deleted_at_idx" ON "exam_questions"("deleted_at");

-- CreateIndex
CREATE INDEX "exam_results_exam_id_idx" ON "exam_results"("exam_id");

-- CreateIndex
CREATE INDEX "exam_results_participant_id_idx" ON "exam_results"("participant_id");

-- CreateIndex
CREATE INDEX "exam_results_question_id_idx" ON "exam_results"("question_id");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_exam_type_id_fkey" FOREIGN KEY ("exam_type_id") REFERENCES "exam_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "exam_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attendances" ADD CONSTRAINT "exam_attendances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attendances" ADD CONSTRAINT "exam_attendances_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "exam_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "question_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "exam_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

