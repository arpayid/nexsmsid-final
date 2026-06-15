CREATE TABLE "school_profiles" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "npsn" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "principal_name" TEXT,
  "logo_url" TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "school_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "academic_years" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "semesters" (
  "id" TEXT NOT NULL,
  "academic_year_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "departments" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "competencies" (
  "id" TEXT NOT NULL,
  "department_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "competencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "classrooms" (
  "id" TEXT NOT NULL,
  "competency_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rooms" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT,
  "capacity" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subjects" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "group" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lesson_hours" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "lesson_hours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_categories" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "default_amount" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "payment_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "academic_years_is_active_idx" ON "academic_years"("is_active");
CREATE INDEX "academic_years_deleted_at_idx" ON "academic_years"("deleted_at");
CREATE INDEX "semesters_academic_year_id_idx" ON "semesters"("academic_year_id");
CREATE INDEX "semesters_is_active_idx" ON "semesters"("is_active");
CREATE INDEX "semesters_deleted_at_idx" ON "semesters"("deleted_at");
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
CREATE INDEX "departments_is_active_idx" ON "departments"("is_active");
CREATE INDEX "departments_deleted_at_idx" ON "departments"("deleted_at");
CREATE UNIQUE INDEX "competencies_code_key" ON "competencies"("code");
CREATE INDEX "competencies_department_id_idx" ON "competencies"("department_id");
CREATE INDEX "competencies_is_active_idx" ON "competencies"("is_active");
CREATE INDEX "competencies_deleted_at_idx" ON "competencies"("deleted_at");
CREATE UNIQUE INDEX "classrooms_code_key" ON "classrooms"("code");
CREATE INDEX "classrooms_competency_id_idx" ON "classrooms"("competency_id");
CREATE INDEX "classrooms_is_active_idx" ON "classrooms"("is_active");
CREATE INDEX "classrooms_deleted_at_idx" ON "classrooms"("deleted_at");
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");
CREATE INDEX "rooms_is_active_idx" ON "rooms"("is_active");
CREATE INDEX "rooms_deleted_at_idx" ON "rooms"("deleted_at");
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");
CREATE INDEX "subjects_is_active_idx" ON "subjects"("is_active");
CREATE INDEX "subjects_deleted_at_idx" ON "subjects"("deleted_at");
CREATE INDEX "lesson_hours_order_idx" ON "lesson_hours"("order");
CREATE INDEX "lesson_hours_is_active_idx" ON "lesson_hours"("is_active");
CREATE INDEX "lesson_hours_deleted_at_idx" ON "lesson_hours"("deleted_at");
CREATE UNIQUE INDEX "payment_categories_code_key" ON "payment_categories"("code");
CREATE INDEX "payment_categories_is_active_idx" ON "payment_categories"("is_active");
CREATE INDEX "payment_categories_deleted_at_idx" ON "payment_categories"("deleted_at");

ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
