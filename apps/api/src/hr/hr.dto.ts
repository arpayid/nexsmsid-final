import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsDateString } from "class-validator";
import { Transform } from "class-transformer";
import { EmployeeStatus, EmploymentType, EmployeeAttendanceStatus, LeaveType, LeaveRequestStatus } from "@prisma/client";

export class CreateHRPositionDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateHRPositionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateEmployeeProfileDto {
  @IsString()
  employeeCode!: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  @IsString()
  @IsOptional()
  positionId?: string;

  @IsString()
  fullName!: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;

  @IsDateString()
  @IsOptional()
  joinedAt?: string;

  @IsDateString()
  @IsOptional()
  endedAt?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @IsString()
  @IsOptional()
  bankAccountName?: string;

  @IsString()
  @IsOptional()
  taxNumber?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  basicSalary?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEmployeeProfileDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  @IsString()
  @IsOptional()
  positionId?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;

  @IsDateString()
  @IsOptional()
  joinedAt?: string;

  @IsDateString()
  @IsOptional()
  endedAt?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @IsString()
  @IsOptional()
  bankAccountName?: string;

  @IsString()
  @IsOptional()
  taxNumber?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  basicSalary?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateEmployeeAttendanceDto {
  @IsString()
  employeeId!: string;

  @IsDateString()
  date!: string;

  @IsEnum(EmployeeAttendanceStatus)
  status!: EmployeeAttendanceStatus;

  @IsDateString()
  @IsOptional()
  checkInAt?: string;

  @IsDateString()
  @IsOptional()
  checkOutAt?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  lateMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  workMinutes?: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateEmployeeAttendanceDto {
  @IsEnum(EmployeeAttendanceStatus)
  @IsOptional()
  status?: EmployeeAttendanceStatus;

  @IsDateString()
  @IsOptional()
  checkInAt?: string;

  @IsDateString()
  @IsOptional()
  checkOutAt?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  lateMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  workMinutes?: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateLeaveRequestDto {
  @IsString()
  employeeId!: string;

  @IsEnum(LeaveType)
  type!: LeaveType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  reason!: string;
}

export class UpdateLeaveRequestDto {
  @IsEnum(LeaveType)
  @IsOptional()
  type?: LeaveType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RejectLeaveRequestDto {
  @IsString()
  rejectionReason!: string;
}
