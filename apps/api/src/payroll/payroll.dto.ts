import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsDateString, IsInt } from "class-validator";
import { Transform } from "class-transformer";
import { PayrollComponentType, PayrollComponentCalculationType, PayrollPaymentMethod } from "@prisma/client";

export class CreatePayrollComponentDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsEnum(PayrollComponentType)
  type!: PayrollComponentType;

  @IsEnum(PayrollComponentCalculationType)
  @IsOptional()
  calculationType?: PayrollComponentCalculationType;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  defaultAmount?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  defaultPercentage?: number;

  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePayrollComponentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(PayrollComponentType)
  @IsOptional()
  type?: PayrollComponentType;

  @IsEnum(PayrollComponentCalculationType)
  @IsOptional()
  calculationType?: PayrollComponentCalculationType;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  defaultAmount?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  defaultPercentage?: number;

  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateEmployeeSalaryComponentDto {
  @IsString()
  employeeId!: string;

  @IsString()
  componentId!: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  amount?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  percentage?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

export class UpdateEmployeeSalaryComponentDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  amount?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  percentage?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

export class CreatePayrollPeriodDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  month!: number;

  @IsInt()
  @Transform(({ value }) => parseInt(value))
  year!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;
}

export class UpdatePayrollPeriodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  month?: number;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  year?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;
}

export class MarkPayslipPaidDto {
  @IsEnum(PayrollPaymentMethod)
  @IsOptional()
  paymentMethod?: PayrollPaymentMethod;

  @IsString()
  @IsOptional()
  paymentReference?: string;
}

export class UpdatePayrollRunDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  grossAmount?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  totalEarnings?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  totalDeductions?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  netAmount?: number;
}
