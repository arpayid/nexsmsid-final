import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsInt, IsDateString, IsDecimal, Min, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { LibraryBookStatus, LibraryCopyStatus, LibraryMemberType, LibraryMemberStatus, InventoryAssetCondition } from "@prisma/client";

export class CreateLibraryCategoryDto {
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

export class UpdateLibraryCategoryDto {
  @IsString()
  @IsOptional()
  code?: string;

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

export class CreateLibraryShelfDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateLibraryShelfDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateLibraryBookDto {
  @IsString()
  categoryId!: string;

  @IsString()
  @IsOptional()
  shelfId?: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsString()
  code!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  author!: string;

  @IsString()
  @IsOptional()
  publisher?: string;

  @IsInt()
  @Min(1000)
  @IsOptional()
  @Type(() => Number)
  publicationYear?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  edition?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsEnum(LibraryBookStatus)
  @IsOptional()
  status?: LibraryBookStatus;
}

export class UpdateLibraryBookDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  shelfId?: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  publisher?: string;

  @IsInt()
  @Min(1000)
  @IsOptional()
  @Type(() => Number)
  publicationYear?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  edition?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsEnum(LibraryBookStatus)
  @IsOptional()
  status?: LibraryBookStatus;
}

export class CreateLibraryBookCopyDto {
  @IsString()
  bookId!: string;

  @IsString()
  copyCode!: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;

  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @IsString()
  @IsOptional()
  acquisitionSource?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsEnum(LibraryCopyStatus)
  @IsOptional()
  status?: LibraryCopyStatus;

  @IsEnum(InventoryAssetCondition)
  @IsOptional()
  condition?: InventoryAssetCondition;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateLibraryBookCopyDto {
  @IsString()
  @IsOptional()
  copyCode?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;

  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @IsString()
  @IsOptional()
  acquisitionSource?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsEnum(LibraryCopyStatus)
  @IsOptional()
  status?: LibraryCopyStatus;

  @IsEnum(InventoryAssetCondition)
  @IsOptional()
  condition?: InventoryAssetCondition;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateLibraryMemberDto {
  @IsString()
  memberCode!: string;

  @IsEnum(LibraryMemberType)
  type!: LibraryMemberType;

  @IsEnum(LibraryMemberStatus)
  @IsOptional()
  status?: LibraryMemberStatus;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  @IsString()
  @IsOptional()
  externalName?: string;

  @IsString()
  @IsOptional()
  externalContact?: string;

  @IsDateString()
  @IsOptional()
  joinedAt?: string;

  @IsDateString()
  @IsOptional()
  expiredAt?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  maxLoan?: number;
}

export class UpdateLibraryMemberDto {
  @IsString()
  @IsOptional()
  memberCode?: string;

  @IsEnum(LibraryMemberType)
  @IsOptional()
  type?: LibraryMemberType;

  @IsEnum(LibraryMemberStatus)
  @IsOptional()
  status?: LibraryMemberStatus;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  @IsString()
  @IsOptional()
  externalName?: string;

  @IsString()
  @IsOptional()
  externalContact?: string;

  @IsDateString()
  @IsOptional()
  joinedAt?: string;

  @IsDateString()
  @IsOptional()
  expiredAt?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  maxLoan?: number;
}

export class CreateLibraryLoanDto {
  @IsString()
  memberId!: string;

  @IsString()
  copyId!: string;

  @IsDateString()
  dueAt!: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class ReturnLibraryLoanDto {
  @IsString()
  @IsOptional()
  returnNote?: string;

  @IsEnum(InventoryAssetCondition)
  @IsOptional()
  condition?: InventoryAssetCondition;
}

export class MarkLostLibraryLoanDto {
  @IsString()
  @IsOptional()
  returnNote?: string;
}

export class CreateLibraryReservationDto {
  @IsString()
  memberId!: string;

  @IsString()
  bookId!: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class PayLibraryFineDto {
  @IsString()
  @IsOptional()
  note?: string;
}

export class WaiveLibraryFineDto {
  @IsString()
  @IsOptional()
  note?: string;
}
