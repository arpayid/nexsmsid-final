-- CreateEnum
CREATE TYPE "InventoryAssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOST', 'DISPOSED', 'BORROWED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "InventoryAssetCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'DAMAGED', 'HEAVILY_DAMAGED');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('ASSET', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'BORROW', 'RETURN', 'DISPOSAL');

-- CreateEnum
CREATE TYPE "InventoryMaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryLoanStatus" AS ENUM ('REQUESTED', 'APPROVED', 'BORROWED', 'RETURNED', 'REJECTED', 'CANCELLED', 'OVERDUE');

-- CreateTable
CREATE TABLE "inventory_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "room_id" TEXT,
    "responsible_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "location_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InventoryItemType" NOT NULL DEFAULT 'ASSET',
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "min_stock" INTEGER,
    "purchase_date" TIMESTAMP(3),
    "purchase_price" DECIMAL(65,30),
    "supplier" TEXT,
    "status" "InventoryAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "condition" "InventoryAssetCondition" NOT NULL DEFAULT 'GOOD',
    "qr_code" TEXT,
    "barcode" TEXT,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "from_location_id" TEXT,
    "to_location_id" TEXT,
    "note" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "performed_by_id" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_maintenances" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "InventoryMaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cost" DECIMAL(65,30),
    "vendor" TEXT,
    "handled_by_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_loans" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "borrower_user_id" TEXT,
    "borrower_name" TEXT NOT NULL,
    "borrower_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purpose" TEXT NOT NULL,
    "status" "InventoryLoanStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "borrowed_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "rejected_by_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_categories_code_key" ON "inventory_categories"("code");

-- CreateIndex
CREATE INDEX "inventory_categories_is_active_idx" ON "inventory_categories"("is_active");

-- CreateIndex
CREATE INDEX "inventory_categories_deleted_at_idx" ON "inventory_categories"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_locations_code_key" ON "inventory_locations"("code");

-- CreateIndex
CREATE INDEX "inventory_locations_room_id_idx" ON "inventory_locations"("room_id");

-- CreateIndex
CREATE INDEX "inventory_locations_responsible_user_id_idx" ON "inventory_locations"("responsible_user_id");

-- CreateIndex
CREATE INDEX "inventory_locations_is_active_idx" ON "inventory_locations"("is_active");

-- CreateIndex
CREATE INDEX "inventory_locations_deleted_at_idx" ON "inventory_locations"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_code_key" ON "inventory_items"("code");

-- CreateIndex
CREATE INDEX "inventory_items_category_id_idx" ON "inventory_items"("category_id");

-- CreateIndex
CREATE INDEX "inventory_items_location_id_idx" ON "inventory_items"("location_id");

-- CreateIndex
CREATE INDEX "inventory_items_code_idx" ON "inventory_items"("code");

-- CreateIndex
CREATE INDEX "inventory_items_name_idx" ON "inventory_items"("name");

-- CreateIndex
CREATE INDEX "inventory_items_type_idx" ON "inventory_items"("type");

-- CreateIndex
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");

-- CreateIndex
CREATE INDEX "inventory_items_condition_idx" ON "inventory_items"("condition");

-- CreateIndex
CREATE INDEX "inventory_items_created_by_id_idx" ON "inventory_items"("created_by_id");

-- CreateIndex
CREATE INDEX "inventory_items_deleted_at_idx" ON "inventory_items"("deleted_at");

-- CreateIndex
CREATE INDEX "inventory_movements_item_id_idx" ON "inventory_movements"("item_id");

-- CreateIndex
CREATE INDEX "inventory_movements_type_idx" ON "inventory_movements"("type");

-- CreateIndex
CREATE INDEX "inventory_movements_from_location_id_idx" ON "inventory_movements"("from_location_id");

-- CreateIndex
CREATE INDEX "inventory_movements_to_location_id_idx" ON "inventory_movements"("to_location_id");

-- CreateIndex
CREATE INDEX "inventory_movements_performed_by_id_idx" ON "inventory_movements"("performed_by_id");

-- CreateIndex
CREATE INDEX "inventory_movements_performed_at_idx" ON "inventory_movements"("performed_at");

-- CreateIndex
CREATE INDEX "inventory_maintenances_item_id_idx" ON "inventory_maintenances"("item_id");

-- CreateIndex
CREATE INDEX "inventory_maintenances_status_idx" ON "inventory_maintenances"("status");

-- CreateIndex
CREATE INDEX "inventory_maintenances_handled_by_id_idx" ON "inventory_maintenances"("handled_by_id");

-- CreateIndex
CREATE INDEX "inventory_maintenances_created_by_id_idx" ON "inventory_maintenances"("created_by_id");

-- CreateIndex
CREATE INDEX "inventory_maintenances_deleted_at_idx" ON "inventory_maintenances"("deleted_at");

-- CreateIndex
CREATE INDEX "inventory_loans_item_id_idx" ON "inventory_loans"("item_id");

-- CreateIndex
CREATE INDEX "inventory_loans_borrower_user_id_idx" ON "inventory_loans"("borrower_user_id");

-- CreateIndex
CREATE INDEX "inventory_loans_status_idx" ON "inventory_loans"("status");

-- CreateIndex
CREATE INDEX "inventory_loans_due_at_idx" ON "inventory_loans"("due_at");

-- CreateIndex
CREATE INDEX "inventory_loans_created_by_id_idx" ON "inventory_loans"("created_by_id");

-- CreateIndex
CREATE INDEX "inventory_loans_deleted_at_idx" ON "inventory_loans"("deleted_at");

-- AddForeignKey
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "inventory_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "inventory_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_maintenances" ADD CONSTRAINT "inventory_maintenances_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_maintenances" ADD CONSTRAINT "inventory_maintenances_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_maintenances" ADD CONSTRAINT "inventory_maintenances_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_borrower_user_id_fkey" FOREIGN KEY ("borrower_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
