-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'RETIRED', 'CONTRACT_ENDED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'HONORARY', 'PART_TIME', 'OUTSOURCED');

-- CreateEnum
CREATE TYPE "PayrollComponentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "PayrollComponentCalculationType" AS ENUM ('FIXED', 'PERCENTAGE', 'DAILY', 'HOURLY', 'PER_SESSION', 'MANUAL');

-- CreateEnum
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('DRAFT', 'OPEN', 'CALCULATED', 'APPROVED', 'PAID', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "EmployeeAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'SICK', 'PERMIT', 'LEAVE', 'LATE', 'HALF_DAY', 'BUSINESS_TRIP');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER');

-- CreateTable
CREATE TABLE "hr_positions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_profiles" (
    "id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "user_id" TEXT,
    "teacher_id" TEXT,
    "staff_id" TEXT,
    "position_id" TEXT,
    "full_name" TEXT NOT NULL,
    "employment_type" "EmploymentType" NOT NULL DEFAULT 'PERMANENT',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "bank_name" TEXT,
    "bank_account_number" TEXT,
    "bank_account_name" TEXT,
    "tax_number" TEXT,
    "basic_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_components" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PayrollComponentType" NOT NULL,
    "calculation_type" "PayrollComponentCalculationType" NOT NULL DEFAULT 'FIXED',
    "default_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "default_percentage" DECIMAL(5,2),
    "is_taxable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payroll_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_employee_salary_components" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "percentage" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payroll_employee_salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "gross_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "paid_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run_items" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "component_id" TEXT,
    "name" TEXT NOT NULL,
    "type" "PayrollComponentType" NOT NULL,
    "calculation_type" "PayrollComponentCalculationType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_run_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_payslips" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "payslip_number" TEXT NOT NULL,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "payment_method" "PayrollPaymentMethod",
    "payment_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payroll_payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_attendance" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "EmployeeAttendanceStatus" NOT NULL,
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "late_minutes" INTEGER NOT NULL DEFAULT 0,
    "work_minutes" INTEGER,
    "note" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_employee_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by_id" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_approvals" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hr_positions_code_key" ON "hr_positions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_profiles_employee_code_key" ON "hr_employee_profiles"("employee_code");

-- CreateIndex
CREATE INDEX "hr_employee_profiles_employee_code_idx" ON "hr_employee_profiles"("employee_code");

-- CreateIndex
CREATE INDEX "hr_employee_profiles_user_id_idx" ON "hr_employee_profiles"("user_id");

-- CreateIndex
CREATE INDEX "hr_employee_profiles_teacher_id_idx" ON "hr_employee_profiles"("teacher_id");

-- CreateIndex
CREATE INDEX "hr_employee_profiles_staff_id_idx" ON "hr_employee_profiles"("staff_id");

-- CreateIndex
CREATE INDEX "hr_employee_profiles_position_id_idx" ON "hr_employee_profiles"("position_id");

-- CreateIndex
CREATE INDEX "hr_employee_profiles_status_idx" ON "hr_employee_profiles"("status");

-- CreateIndex
CREATE INDEX "hr_employee_profiles_employment_type_idx" ON "hr_employee_profiles"("employment_type");

-- CreateIndex
CREATE INDEX "hr_employee_profiles_deleted_at_idx" ON "hr_employee_profiles"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_components_code_key" ON "payroll_components"("code");

-- CreateIndex
CREATE INDEX "payroll_components_code_idx" ON "payroll_components"("code");

-- CreateIndex
CREATE INDEX "payroll_components_type_idx" ON "payroll_components"("type");

-- CreateIndex
CREATE INDEX "payroll_components_is_active_idx" ON "payroll_components"("is_active");

-- CreateIndex
CREATE INDEX "payroll_components_deleted_at_idx" ON "payroll_components"("deleted_at");

-- CreateIndex
CREATE INDEX "payroll_employee_salary_components_employee_id_idx" ON "payroll_employee_salary_components"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_employee_salary_components_component_id_idx" ON "payroll_employee_salary_components"("component_id");

-- CreateIndex
CREATE INDEX "payroll_employee_salary_components_is_active_idx" ON "payroll_employee_salary_components"("is_active");

-- CreateIndex
CREATE INDEX "payroll_employee_salary_components_effective_from_idx" ON "payroll_employee_salary_components"("effective_from");

-- CreateIndex
CREATE INDEX "payroll_employee_salary_components_effective_to_idx" ON "payroll_employee_salary_components"("effective_to");

-- CreateIndex
CREATE INDEX "payroll_employee_salary_components_deleted_at_idx" ON "payroll_employee_salary_components"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_code_key" ON "payroll_periods"("code");

-- CreateIndex
CREATE INDEX "payroll_periods_code_idx" ON "payroll_periods"("code");

-- CreateIndex
CREATE INDEX "payroll_periods_month_idx" ON "payroll_periods"("month");

-- CreateIndex
CREATE INDEX "payroll_periods_year_idx" ON "payroll_periods"("year");

-- CreateIndex
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- CreateIndex
CREATE INDEX "payroll_periods_deleted_at_idx" ON "payroll_periods"("deleted_at");

-- CreateIndex
CREATE INDEX "payroll_runs_period_id_idx" ON "payroll_runs"("period_id");

-- CreateIndex
CREATE INDEX "payroll_runs_employee_id_idx" ON "payroll_runs"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs"("status");

-- CreateIndex
CREATE INDEX "payroll_runs_deleted_at_idx" ON "payroll_runs"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_period_id_employee_id_key" ON "payroll_runs"("period_id", "employee_id");

-- CreateIndex
CREATE INDEX "payroll_run_items_payroll_run_id_idx" ON "payroll_run_items"("payroll_run_id");

-- CreateIndex
CREATE INDEX "payroll_run_items_component_id_idx" ON "payroll_run_items"("component_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_payslips_payroll_run_id_key" ON "payroll_payslips"("payroll_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_payslips_payslip_number_key" ON "payroll_payslips"("payslip_number");

-- CreateIndex
CREATE INDEX "payroll_payslips_payslip_number_idx" ON "payroll_payslips"("payslip_number");

-- CreateIndex
CREATE INDEX "payroll_payslips_payroll_run_id_idx" ON "payroll_payslips"("payroll_run_id");

-- CreateIndex
CREATE INDEX "payroll_payslips_status_idx" ON "payroll_payslips"("status");

-- CreateIndex
CREATE INDEX "payroll_payslips_deleted_at_idx" ON "payroll_payslips"("deleted_at");

-- CreateIndex
CREATE INDEX "hr_employee_attendance_employee_id_idx" ON "hr_employee_attendance"("employee_id");

-- CreateIndex
CREATE INDEX "hr_employee_attendance_date_idx" ON "hr_employee_attendance"("date");

-- CreateIndex
CREATE INDEX "hr_employee_attendance_status_idx" ON "hr_employee_attendance"("status");

-- CreateIndex
CREATE INDEX "hr_employee_attendance_deleted_at_idx" ON "hr_employee_attendance"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_attendance_employee_id_date_key" ON "hr_employee_attendance"("employee_id", "date");

-- CreateIndex
CREATE INDEX "hr_leave_requests_employee_id_idx" ON "hr_leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "hr_leave_requests_status_idx" ON "hr_leave_requests"("status");

-- CreateIndex
CREATE INDEX "hr_leave_requests_start_date_idx" ON "hr_leave_requests"("start_date");

-- CreateIndex
CREATE INDEX "hr_leave_requests_end_date_idx" ON "hr_leave_requests"("end_date");

-- CreateIndex
CREATE INDEX "hr_leave_requests_deleted_at_idx" ON "hr_leave_requests"("deleted_at");

-- AddForeignKey
ALTER TABLE "hr_employee_profiles" ADD CONSTRAINT "hr_employee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_profiles" ADD CONSTRAINT "hr_employee_profiles_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_profiles" ADD CONSTRAINT "hr_employee_profiles_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_profiles" ADD CONSTRAINT "hr_employee_profiles_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "hr_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_profiles" ADD CONSTRAINT "hr_employee_profiles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_profiles" ADD CONSTRAINT "hr_employee_profiles_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_employee_salary_components" ADD CONSTRAINT "payroll_employee_salary_components_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_employee_salary_components" ADD CONSTRAINT "payroll_employee_salary_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "payroll_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_paid_by_id_fkey" FOREIGN KEY ("paid_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_run_items" ADD CONSTRAINT "payroll_run_items_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_run_items" ADD CONSTRAINT "payroll_run_items_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "payroll_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_payslips" ADD CONSTRAINT "payroll_payslips_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_attendance" ADD CONSTRAINT "hr_employee_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employee_attendance" ADD CONSTRAINT "hr_employee_attendance_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
