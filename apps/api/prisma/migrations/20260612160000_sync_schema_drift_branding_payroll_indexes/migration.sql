-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "inventory_items" ALTER COLUMN "purchase_price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "penalty" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "paid_amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "payroll_payslips" ADD COLUMN     "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "basic_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "net_pay" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "school_profiles" ADD COLUMN     "accent_color" TEXT DEFAULT '#3b82f6',
ADD COLUMN     "primary_color" TEXT DEFAULT '#4f46e5',
ADD COLUMN     "secondary_color" TEXT DEFAULT '#6366f1';

-- CreateIndex
CREATE INDEX "attendance_records_session_id_student_id_idx" ON "attendance_records"("session_id", "student_id");

-- CreateIndex
CREATE INDEX "grades_assessment_id_student_id_idx" ON "grades"("assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "hr_positions_is_active_idx" ON "hr_positions"("is_active");

-- CreateIndex
CREATE INDEX "hr_positions_name_idx" ON "hr_positions"("name");

-- CreateIndex
CREATE INDEX "hr_positions_deleted_at_idx" ON "hr_positions"("deleted_at");

-- CreateIndex
CREATE INDEX "invoices_status_student_id_due_date_idx" ON "invoices"("status", "student_id", "due_date");

-- CreateIndex
CREATE INDEX "letter_number_sequences_category_year_idx" ON "letter_number_sequences"("category", "year");

-- CreateIndex
CREATE INDEX "library_categories_is_active_idx" ON "library_categories"("is_active");

-- CreateIndex
CREATE INDEX "library_categories_name_idx" ON "library_categories"("name");

-- CreateIndex
CREATE INDEX "library_categories_deleted_at_idx" ON "library_categories"("deleted_at");

-- CreateIndex
CREATE INDEX "library_shelves_is_active_idx" ON "library_shelves"("is_active");

-- CreateIndex
CREATE INDEX "library_shelves_name_idx" ON "library_shelves"("name");

-- CreateIndex
CREATE INDEX "library_shelves_location_idx" ON "library_shelves"("location");

-- CreateIndex
CREATE INDEX "library_shelves_deleted_at_idx" ON "library_shelves"("deleted_at");

-- CreateIndex
CREATE INDEX "payments_status_invoice_id_idx" ON "payments"("status", "invoice_id");

-- CreateIndex
CREATE INDEX "payroll_approvals_period_id_idx" ON "payroll_approvals"("period_id");

-- CreateIndex
CREATE INDEX "payroll_approvals_approver_id_idx" ON "payroll_approvals"("approver_id");

-- CreateIndex
CREATE INDEX "payroll_approvals_status_idx" ON "payroll_approvals"("status");

-- CreateIndex
CREATE INDEX "permissions_group_idx" ON "permissions"("group");

-- CreateIndex
CREATE INDEX "roles_is_active_idx" ON "roles"("is_active");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "school_profiles_npsn_idx" ON "school_profiles"("npsn");

-- CreateIndex
CREATE INDEX "school_profiles_name_idx" ON "school_profiles"("name");

-- CreateIndex
CREATE INDEX "students_status_classroom_id_deleted_at_idx" ON "students"("status", "classroom_id", "deleted_at");

-- CreateIndex
CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");

