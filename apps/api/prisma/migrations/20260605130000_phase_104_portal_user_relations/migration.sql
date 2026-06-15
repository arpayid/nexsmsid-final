-- AlterTable
ALTER TABLE "teachers" ADD COLUMN "user_id" TEXT;
ALTER TABLE "students" ADD COLUMN "user_id" TEXT;
ALTER TABLE "guardians" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");
CREATE UNIQUE INDEX "guardians_user_id_key" ON "guardians"("user_id");

CREATE INDEX "teachers_user_id_idx" ON "teachers"("user_id");
CREATE INDEX "students_user_id_idx" ON "students"("user_id");
CREATE INDEX "guardians_user_id_idx" ON "guardians"("user_id");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
