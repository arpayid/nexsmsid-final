-- CreateEnum
CREATE TYPE "LibraryBookStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LibraryCopyStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'RESERVED', 'LOST', 'DAMAGED', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LibraryMemberType" AS ENUM ('STUDENT', 'TEACHER', 'STAFF', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "LibraryMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LibraryLoanStatus" AS ENUM ('BORROWED', 'RETURNED', 'OVERDUE', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LibraryReservationStatus" AS ENUM ('PENDING', 'READY', 'BORROWED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LibraryFineStatus" AS ENUM ('UNPAID', 'PAID', 'WAIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "library_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_shelves" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_books" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "shelf_id" TEXT,
    "isbn" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "author" TEXT NOT NULL,
    "publisher" TEXT,
    "publication_year" INTEGER,
    "language" TEXT,
    "edition" TEXT,
    "description" TEXT,
    "cover_url" TEXT,
    "status" "LibraryBookStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_book_copies" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "copy_code" TEXT NOT NULL,
    "barcode" TEXT,
    "qr_code" TEXT,
    "acquisition_date" TIMESTAMP(3),
    "acquisition_source" TEXT,
    "price" DECIMAL(12,2),
    "status" "LibraryCopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" "InventoryAssetCondition",
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_book_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_members" (
    "id" TEXT NOT NULL,
    "member_code" TEXT NOT NULL,
    "type" "LibraryMemberType" NOT NULL,
    "status" "LibraryMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "user_id" TEXT,
    "student_id" TEXT,
    "teacher_id" TEXT,
    "staff_id" TEXT,
    "external_name" TEXT,
    "external_contact" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP(3),
    "max_loan" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_loans" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "copy_id" TEXT NOT NULL,
    "borrowed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "status" "LibraryLoanStatus" NOT NULL DEFAULT 'BORROWED',
    "note" TEXT,
    "return_note" TEXT,
    "borrowed_by_id" TEXT NOT NULL,
    "returned_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_reservations" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "status" "LibraryReservationStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ready_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_fines" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LibraryFineStatus" NOT NULL DEFAULT 'UNPAID',
    "paid_at" TIMESTAMP(3),
    "waived_at" TIMESTAMP(3),
    "handled_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_fines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_categories_code_key" ON "library_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "library_shelves_code_key" ON "library_shelves"("code");

-- CreateIndex
CREATE UNIQUE INDEX "library_books_code_key" ON "library_books"("code");

-- CreateIndex
CREATE INDEX "library_books_category_id_idx" ON "library_books"("category_id");

-- CreateIndex
CREATE INDEX "library_books_shelf_id_idx" ON "library_books"("shelf_id");

-- CreateIndex
CREATE INDEX "library_books_code_idx" ON "library_books"("code");

-- CreateIndex
CREATE INDEX "library_books_isbn_idx" ON "library_books"("isbn");

-- CreateIndex
CREATE INDEX "library_books_title_idx" ON "library_books"("title");

-- CreateIndex
CREATE INDEX "library_books_author_idx" ON "library_books"("author");

-- CreateIndex
CREATE INDEX "library_books_status_idx" ON "library_books"("status");

-- CreateIndex
CREATE INDEX "library_books_deleted_at_idx" ON "library_books"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "library_book_copies_copy_code_key" ON "library_book_copies"("copy_code");

-- CreateIndex
CREATE INDEX "library_book_copies_book_id_idx" ON "library_book_copies"("book_id");

-- CreateIndex
CREATE INDEX "library_book_copies_copy_code_idx" ON "library_book_copies"("copy_code");

-- CreateIndex
CREATE INDEX "library_book_copies_barcode_idx" ON "library_book_copies"("barcode");

-- CreateIndex
CREATE INDEX "library_book_copies_status_idx" ON "library_book_copies"("status");

-- CreateIndex
CREATE INDEX "library_book_copies_deleted_at_idx" ON "library_book_copies"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "library_members_member_code_key" ON "library_members"("member_code");

-- CreateIndex
CREATE INDEX "library_members_member_code_idx" ON "library_members"("member_code");

-- CreateIndex
CREATE INDEX "library_members_type_idx" ON "library_members"("type");

-- CreateIndex
CREATE INDEX "library_members_status_idx" ON "library_members"("status");

-- CreateIndex
CREATE INDEX "library_members_user_id_idx" ON "library_members"("user_id");

-- CreateIndex
CREATE INDEX "library_members_student_id_idx" ON "library_members"("student_id");

-- CreateIndex
CREATE INDEX "library_members_teacher_id_idx" ON "library_members"("teacher_id");

-- CreateIndex
CREATE INDEX "library_members_staff_id_idx" ON "library_members"("staff_id");

-- CreateIndex
CREATE INDEX "library_members_deleted_at_idx" ON "library_members"("deleted_at");

-- CreateIndex
CREATE INDEX "library_loans_member_id_idx" ON "library_loans"("member_id");

-- CreateIndex
CREATE INDEX "library_loans_copy_id_idx" ON "library_loans"("copy_id");

-- CreateIndex
CREATE INDEX "library_loans_status_idx" ON "library_loans"("status");

-- CreateIndex
CREATE INDEX "library_loans_borrowed_at_idx" ON "library_loans"("borrowed_at");

-- CreateIndex
CREATE INDEX "library_loans_due_at_idx" ON "library_loans"("due_at");

-- CreateIndex
CREATE INDEX "library_loans_returned_at_idx" ON "library_loans"("returned_at");

-- CreateIndex
CREATE INDEX "library_loans_deleted_at_idx" ON "library_loans"("deleted_at");

-- CreateIndex
CREATE INDEX "library_reservations_member_id_idx" ON "library_reservations"("member_id");

-- CreateIndex
CREATE INDEX "library_reservations_book_id_idx" ON "library_reservations"("book_id");

-- CreateIndex
CREATE INDEX "library_reservations_status_idx" ON "library_reservations"("status");

-- CreateIndex
CREATE INDEX "library_reservations_requested_at_idx" ON "library_reservations"("requested_at");

-- CreateIndex
CREATE INDEX "library_reservations_expired_at_idx" ON "library_reservations"("expired_at");

-- CreateIndex
CREATE INDEX "library_reservations_deleted_at_idx" ON "library_reservations"("deleted_at");

-- CreateIndex
CREATE INDEX "library_fines_loan_id_idx" ON "library_fines"("loan_id");

-- CreateIndex
CREATE INDEX "library_fines_member_id_idx" ON "library_fines"("member_id");

-- CreateIndex
CREATE INDEX "library_fines_status_idx" ON "library_fines"("status");

-- CreateIndex
CREATE INDEX "library_fines_created_at_idx" ON "library_fines"("created_at");

-- CreateIndex
CREATE INDEX "library_fines_deleted_at_idx" ON "library_fines"("deleted_at");

-- AddForeignKey
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "library_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "library_shelves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_book_copies" ADD CONSTRAINT "library_book_copies_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "library_books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "library_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "library_book_copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_borrowed_by_id_fkey" FOREIGN KEY ("borrowed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_returned_by_id_fkey" FOREIGN KEY ("returned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "library_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "library_books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_fines" ADD CONSTRAINT "library_fines_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "library_loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_fines" ADD CONSTRAINT "library_fines_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "library_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_fines" ADD CONSTRAINT "library_fines_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
