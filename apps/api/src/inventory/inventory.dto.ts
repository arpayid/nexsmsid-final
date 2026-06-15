import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, IsNumber, Min } from "class-validator";
import { InventoryAssetStatus, InventoryAssetCondition, InventoryItemType, InventoryMovementType } from "@prisma/client";

export class CreateInventoryCategoryDto {
  @IsString() code!: string;
  @IsString() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class UpdateInventoryCategoryDto extends CreateInventoryCategoryDto {}

export class CreateInventoryLocationDto {
  @IsString() code!: string;
  @IsString() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() roomId?: string;
  @IsString() @IsOptional() responsibleUserId?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class UpdateInventoryLocationDto extends CreateInventoryLocationDto {}

export class CreateInventoryItemDto {
  @IsString() categoryId!: string;
  @IsString() @IsOptional() locationId?: string;
  @IsString() code!: string;
  @IsString() name!: string;
  @IsEnum(InventoryItemType) @IsOptional() type?: InventoryItemType;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() brand?: string;
  @IsString() @IsOptional() model?: string;
  @IsString() @IsOptional() unit?: string;
  @IsInt() @Min(0) @IsOptional() quantity?: number;
  @IsInt() @Min(0) @IsOptional() minStock?: number;
  @IsString() @IsOptional() purchaseDate?: string;
  @IsNumber() @IsOptional() purchasePrice?: number;
  @IsString() @IsOptional() supplier?: string;
  @IsEnum(InventoryAssetStatus) @IsOptional() status?: InventoryAssetStatus;
  @IsEnum(InventoryAssetCondition) @IsOptional() condition?: InventoryAssetCondition;
  @IsString() @IsOptional() qrCode?: string;
  @IsString() @IsOptional() barcode?: string;
}

export class UpdateInventoryItemDto {
  @IsString() @IsOptional() categoryId?: string;
  @IsString() @IsOptional() locationId?: string;
  @IsString() @IsOptional() code?: string;
  @IsString() @IsOptional() name?: string;
  @IsEnum(InventoryItemType) @IsOptional() type?: InventoryItemType;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() brand?: string;
  @IsString() @IsOptional() model?: string;
  @IsString() @IsOptional() unit?: string;
  @IsInt() @Min(0) @IsOptional() minStock?: number;
  @IsString() @IsOptional() purchaseDate?: string;
  @IsNumber() @IsOptional() purchasePrice?: number;
  @IsString() @IsOptional() supplier?: string;
  @IsEnum(InventoryAssetStatus) @IsOptional() status?: InventoryAssetStatus;
  @IsEnum(InventoryAssetCondition) @IsOptional() condition?: InventoryAssetCondition;
  @IsString() @IsOptional() qrCode?: string;
  @IsString() @IsOptional() barcode?: string;
}

export class CreateInventoryMovementDto {
  @IsString() itemId!: string;
  @IsEnum(InventoryMovementType) type!: InventoryMovementType;
  @IsInt() @Min(1) quantity!: number;
  @IsString() @IsOptional() fromLocationId?: string;
  @IsString() @IsOptional() toLocationId?: string;
  @IsString() @IsOptional() note?: string;
  @IsString() @IsOptional() referenceType?: string;
  @IsString() @IsOptional() referenceId?: string;
}

export class CreateInventoryMaintenanceDto {
  @IsString() itemId!: string;
  @IsString() title!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() scheduledAt?: string;
  @IsNumber() @IsOptional() cost?: number;
  @IsString() @IsOptional() vendor?: string;
}

export class UpdateInventoryMaintenanceDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() scheduledAt?: string;
  @IsNumber() @IsOptional() cost?: number;
  @IsString() @IsOptional() vendor?: string;
}

export class CreateInventoryLoanDto {
  @IsString() itemId!: string;
  @IsString() @IsOptional() borrowerUserId?: string;
  @IsString() borrowerName!: string;
  @IsString() borrowerType!: string;
  @IsInt() @Min(1) @IsOptional() quantity?: number;
  @IsString() purpose!: string;
  @IsString() @IsOptional() dueAt?: string;
  @IsString() @IsOptional() note?: string;
}

export class UpdateInventoryLoanDto {
  @IsString() @IsOptional() dueAt?: string;
  @IsString() @IsOptional() note?: string;
}

export class InventoryQueryDto {
  @IsString() @IsOptional() search?: string;
  @IsString() @IsOptional() categoryId?: string;
  @IsString() @IsOptional() locationId?: string;
  @IsEnum(InventoryItemType) @IsOptional() type?: InventoryItemType;
  @IsEnum(InventoryAssetStatus) @IsOptional() status?: InventoryAssetStatus;
  @IsEnum(InventoryAssetCondition) @IsOptional() condition?: InventoryAssetCondition;
  @IsString() @IsOptional() startDate?: string;
  @IsString() @IsOptional() endDate?: string;
  @IsString() @IsOptional() page?: string;
  @IsString() @IsOptional() limit?: string;
}
