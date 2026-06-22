import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Res } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import {
  LibraryBookStatus,
  LibraryCopyStatus,
  LibraryFineStatus,
  LibraryLoanStatus,
  LibraryMemberStatus,
  LibraryMemberType,
  LibraryReservationStatus,
} from "@prisma/client";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { LibraryCatalogService } from "./library-catalog.service";
import { LibraryCirculationService } from "./library-circulation.service";
import { LibraryFinesService } from "./library-fines.service";
import { LibraryMembersService } from "./library-members.service";
import { LibraryDashboardService } from "./library-dashboard.service";
import { LibraryPdfService } from "./library-pdf.service";
import {
  CreateLibraryCategoryDto,
  UpdateLibraryCategoryDto,
  CreateLibraryShelfDto,
  UpdateLibraryShelfDto,
  CreateLibraryBookDto,
  UpdateLibraryBookDto,
  CreateLibraryBookCopyDto,
  UpdateLibraryBookCopyDto,
  CreateLibraryMemberDto,
  UpdateLibraryMemberDto,
  CreateLibraryLoanDto,
  ReturnLibraryLoanDto,
  MarkLostLibraryLoanDto,
  CreateLibraryReservationDto,
  PayLibraryFineDto,
  WaiveLibraryFineDto,
} from "./library.dto";

type QueryRecord = Record<string, string | undefined>;

function asQueryRecord(query: unknown): QueryRecord {
  return query as QueryRecord;
}

@Controller("library")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Library")
@ApiBearerAuth()
export class LibraryController {
  constructor(
    private readonly catalogService: LibraryCatalogService,
    private readonly circulationService: LibraryCirculationService,
    private readonly finesService: LibraryFinesService,
    private readonly membersService: LibraryMembersService,
    private readonly dashboardService: LibraryDashboardService,
    private readonly pdfService: LibraryPdfService,
  ) {}

  // =========================================================================
  // CATEGORIES
  // =========================================================================

  @ApiOperation({ summary: "Get Categories" })
  @ApiResponse({ status: 200, description: "Library get categories" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("categories")
  @RequirePermissions("library.view")
  getCategories(@Query() query: unknown) {
    const q = asQueryRecord(query);
    return this.catalogService.getCategories({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
      search: q.search,
    });
  }

  @ApiOperation({ summary: "Create Category" })
  @ApiResponse({ status: 200, description: "Library create category" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("categories")
  @RequirePermissions("library.create")
  createCategory(@Body() dto: CreateLibraryCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.createCategory(dto, user.id);
  }

  @ApiOperation({ summary: "Get Category" })
  @ApiResponse({ status: 200, description: "Library get category" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("categories/:id")
  @RequirePermissions("library.view")
  getCategory(@Param("id", ParseCuidPipe) id: string) {
    return this.catalogService.getCategory(id);
  }

  @ApiOperation({ summary: "Update Category" })
  @ApiResponse({ status: 200, description: "Library update category" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("categories/:id")
  @RequirePermissions("library.update")
  updateCategory(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateLibraryCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.updateCategory(id, dto, user.id);
  }

  @ApiOperation({ summary: "Delete Category" })
  @ApiResponse({ status: 200, description: "Library delete category" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("categories/:id")
  @RequirePermissions("library.delete")
  deleteCategory(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.deleteCategory(id, user.id);
  }

  // =========================================================================
  // SHELVES
  // =========================================================================

  @ApiOperation({ summary: "Get Shelves" })
  @ApiResponse({ status: 200, description: "Library get shelves" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("shelves")
  @RequirePermissions("library.view")
  getShelves(@Query() query: unknown) {
    const q = asQueryRecord(query);
    return this.catalogService.getShelves({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
      search: q.search,
    });
  }

  @ApiOperation({ summary: "Create Shelf" })
  @ApiResponse({ status: 200, description: "Library create shelf" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("shelves")
  @RequirePermissions("library.create")
  createShelf(@Body() dto: CreateLibraryShelfDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.createShelf(dto, user.id);
  }

  @ApiOperation({ summary: "Get Shelf" })
  @ApiResponse({ status: 200, description: "Library get shelf" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("shelves/:id")
  @RequirePermissions("library.view")
  getShelf(@Param("id", ParseCuidPipe) id: string) {
    return this.catalogService.getShelf(id);
  }

  @ApiOperation({ summary: "Update Shelf" })
  @ApiResponse({ status: 200, description: "Library update shelf" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("shelves/:id")
  @RequirePermissions("library.update")
  updateShelf(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateLibraryShelfDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.updateShelf(id, dto, user.id);
  }

  @ApiOperation({ summary: "Delete Shelf" })
  @ApiResponse({ status: 200, description: "Library delete shelf" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("shelves/:id")
  @RequirePermissions("library.delete")
  deleteShelf(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.deleteShelf(id, user.id);
  }

  // =========================================================================
  // BOOKS
  // =========================================================================

  @ApiOperation({ summary: "Get Books" })
  @ApiResponse({ status: 200, description: "Library get books" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("books")
  @RequirePermissions("library.view")
  getBooks(@Query() query: unknown) {
    const q = asQueryRecord(query);
    return this.catalogService.getBooks({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
      search: q.search,
      categoryId: q.categoryId,
      shelfId: q.shelfId,
      status: q.status as LibraryBookStatus | undefined,
    });
  }

  @ApiOperation({ summary: "Create Book" })
  @ApiResponse({ status: 200, description: "Library create book" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("books")
  @RequirePermissions("library.create")
  createBook(@Body() dto: CreateLibraryBookDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.createBook(dto, user.id);
  }

  @ApiOperation({ summary: "Get Book" })
  @ApiResponse({ status: 200, description: "Library get book" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("books/:id")
  @RequirePermissions("library.view")
  getBook(@Param("id", ParseCuidPipe) id: string) {
    return this.catalogService.getBook(id);
  }

  @ApiOperation({ summary: "Update Book" })
  @ApiResponse({ status: 200, description: "Library update book" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("books/:id")
  @RequirePermissions("library.update")
  updateBook(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateLibraryBookDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.updateBook(id, dto, user.id);
  }

  @ApiOperation({ summary: "Delete Book" })
  @ApiResponse({ status: 200, description: "Library delete book" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("books/:id")
  @RequirePermissions("library.delete")
  deleteBook(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.deleteBook(id, user.id);
  }

  // =========================================================================
  // COPIES
  // =========================================================================

  @ApiOperation({ summary: "Get Copies" })
  @ApiResponse({ status: 200, description: "Library get copies" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("books/:bookId/copies")
  @RequirePermissions("library.view")
  getCopies(@Param("bookId") bookId: string, @Query() query: unknown) {
    const q = asQueryRecord(query);
    return this.catalogService.getCopies(bookId, {
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
      status: q.status as LibraryCopyStatus | undefined,
    });
  }

  @ApiOperation({ summary: "Create Copy" })
  @ApiResponse({ status: 200, description: "Library create copy" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("books/:bookId/copies")
  @RequirePermissions("library.create")
  createCopy(
    @Param("bookId", ParseCuidPipe) bookId: string,
    @Body() dto: CreateLibraryBookCopyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogService.createCopy(bookId, dto, user.id);
  }

  @ApiOperation({ summary: "List All Copies" })
  @ApiResponse({ status: 200, description: "Library list all copies" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("copies")
  @RequirePermissions("library.view")
  async listAllCopies(@Query() query: { page?: string | number; limit?: string | number; search?: string; status?: LibraryCopyStatus }) {
    const data = await this.catalogService.listAllCopies(query);
    return apiSuccess("Copies retrieved", data.data, data.meta);
  }

  @ApiOperation({ summary: "Get Copy" })
  @ApiResponse({ status: 200, description: "Library get copy" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("copies/:id")
  @RequirePermissions("library.view")
  getCopy(@Param("id", ParseCuidPipe) id: string) {
    return this.catalogService.getCopy(id);
  }

  @ApiOperation({ summary: "Update Copy" })
  @ApiResponse({ status: 200, description: "Library update copy" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("copies/:id")
  @RequirePermissions("library.update")
  updateCopy(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateLibraryBookCopyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.updateCopy(id, dto, user.id);
  }

  @ApiOperation({ summary: "Delete Copy" })
  @ApiResponse({ status: 200, description: "Library delete copy" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("copies/:id")
  @RequirePermissions("library.delete")
  deleteCopy(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogService.deleteCopy(id, user.id);
  }

  // =========================================================================
  // MEMBERS
  // =========================================================================

  @ApiOperation({ summary: "Get Members" })
  @ApiResponse({ status: 200, description: "Library get members" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("members")
  @RequirePermissions("library.view")
  getMembers(@Query() query: unknown) {
    const q = asQueryRecord(query);
    return this.membersService.getMembers({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
      search: q.search,
      type: q.type as LibraryMemberType | undefined,
      status: q.status as LibraryMemberStatus | undefined,
    });
  }

  @ApiOperation({ summary: "Create Member" })
  @ApiResponse({ status: 200, description: "Library create member" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("members")
  @RequirePermissions("library.create")
  createMember(@Body() dto: CreateLibraryMemberDto, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.createMember(dto, user.id);
  }

  @ApiOperation({ summary: "Get Member" })
  @ApiResponse({ status: 200, description: "Library get member" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("members/:id")
  @RequirePermissions("library.view")
  getMember(@Param("id", ParseCuidPipe) id: string) {
    return this.membersService.getMember(id);
  }

  @ApiOperation({ summary: "Update Member" })
  @ApiResponse({ status: 200, description: "Library update member" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("members/:id")
  @RequirePermissions("library.update")
  updateMember(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateLibraryMemberDto, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.updateMember(id, dto, user.id);
  }

  @ApiOperation({ summary: "Delete Member" })
  @ApiResponse({ status: 200, description: "Library delete member" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("members/:id")
  @RequirePermissions("library.delete")
  deleteMember(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.deleteMember(id, user.id);
  }

  // =========================================================================
  // LOANS
  // =========================================================================

  @ApiOperation({ summary: "Get Loans" })
  @ApiResponse({ status: 200, description: "Library get loans" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("loans")
  @RequirePermissions("library.view")
  getLoans(@Query() query: unknown) {
    const q = asQueryRecord(query);
    return this.circulationService.getLoans({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
      status: q.status as LibraryLoanStatus | undefined,
      memberId: q.memberId,
      overdueOnly: q.overdueOnly === "true",
    });
  }

  @ApiOperation({ summary: "Create Loan" })
  @ApiResponse({ status: 200, description: "Library create loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans")
  @RequirePermissions("library.borrow")
  createLoan(@Body() dto: CreateLibraryLoanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.createLoan(dto, user.id);
  }

  @ApiOperation({ summary: "Get Loan" })
  @ApiResponse({ status: 200, description: "Library get loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("loans/:id")
  @RequirePermissions("library.view")
  getLoan(@Param("id", ParseCuidPipe) id: string) {
    return this.circulationService.getLoan(id);
  }

  @ApiOperation({ summary: "Return Loan" })
  @ApiResponse({ status: 200, description: "Library return loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans/:id/return")
  @RequirePermissions("library.return")
  returnLoan(@Param("id", ParseCuidPipe) id: string, @Body() dto: ReturnLibraryLoanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.returnLoan(id, dto, user.id);
  }

  @ApiOperation({ summary: "Mark Lost Loan" })
  @ApiResponse({ status: 200, description: "Library mark lost loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans/:id/mark-lost")
  @RequirePermissions("library.update")
  markLostLoan(@Param("id", ParseCuidPipe) id: string, @Body() dto: MarkLostLibraryLoanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.markLostLoan(id, dto, user.id);
  }

  @ApiOperation({ summary: "Cancel Loan" })
  @ApiResponse({ status: 200, description: "Library cancel loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans/:id/cancel")
  @RequirePermissions("library.update")
  cancelLoan(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.cancelLoan(id, user.id);
  }

  @ApiOperation({ summary: "Delete Loan" })
  @ApiResponse({ status: 200, description: "Library delete loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("loans/:id")
  @RequirePermissions("library.delete")
  deleteLoan(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.deleteLoan(id, user.id);
  }

  // =========================================================================
  // RESERVATIONS
  // =========================================================================

  @ApiOperation({ summary: "Get Reservations" })
  @ApiResponse({ status: 200, description: "Library get reservations" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("reservations")
  @RequirePermissions("library.view")
  getReservations(@Query() query: unknown) {
    const q = asQueryRecord(query);
    return this.circulationService.getReservations({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
      status: q.status as LibraryReservationStatus | undefined,
      memberId: q.memberId,
    });
  }

  @ApiOperation({ summary: "Create Reservation" })
  @ApiResponse({ status: 200, description: "Library create reservation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("reservations")
  @RequirePermissions("library.reserve")
  createReservation(@Body() dto: CreateLibraryReservationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.createReservation(dto, user.id);
  }

  @ApiOperation({ summary: "Get Reservation" })
  @ApiResponse({ status: 200, description: "Library get reservation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("reservations/:id")
  @RequirePermissions("library.view")
  getReservation(@Param("id", ParseCuidPipe) id: string) {
    return this.circulationService.getReservation(id);
  }

  @ApiOperation({ summary: "Mark Reservation Ready" })
  @ApiResponse({ status: 200, description: "Library mark reservation ready" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("reservations/:id/mark-ready")
  @RequirePermissions("library.update")
  markReservationReady(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.markReservationReady(id, user.id);
  }

  @ApiOperation({ summary: "Cancel Reservation" })
  @ApiResponse({ status: 200, description: "Library cancel reservation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("reservations/:id/cancel")
  @RequirePermissions("library.update")
  cancelReservation(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.cancelReservation(id, user.id);
  }

  @ApiOperation({ summary: "Expire Reservation" })
  @ApiResponse({ status: 200, description: "Library expire reservation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("reservations/:id/expire")
  @RequirePermissions("library.update")
  expireReservation(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.circulationService.expireReservation(id, user.id);
  }

  // =========================================================================
  // FINES
  // =========================================================================

  @ApiOperation({ summary: "Get Fines" })
  @ApiResponse({ status: 200, description: "Library get fines" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("fines")
  @RequirePermissions("library.view")
  getFines(@Query() query: unknown) {
    const q = asQueryRecord(query);
    return this.finesService.getFines({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
      status: q.status as LibraryFineStatus | undefined,
      memberId: q.memberId,
    });
  }

  @ApiOperation({ summary: "Get Fine" })
  @ApiResponse({ status: 200, description: "Library get fine" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("fines/:id")
  @RequirePermissions("library.view")
  getFine(@Param("id", ParseCuidPipe) id: string) {
    return this.finesService.getFine(id);
  }

  @ApiOperation({ summary: "Pay Fine" })
  @ApiResponse({ status: 200, description: "Library pay fine" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("fines/:id/pay")
  @RequirePermissions("library.fine")
  payFine(@Param("id", ParseCuidPipe) id: string, @Body() dto: PayLibraryFineDto, @CurrentUser() user: AuthenticatedUser) {
    return this.finesService.payFine(id, dto, user.id);
  }

  @ApiOperation({ summary: "Waive Fine" })
  @ApiResponse({ status: 200, description: "Library waive fine" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("fines/:id/waive")
  @RequirePermissions("library.fine")
  waiveFine(@Param("id", ParseCuidPipe) id: string, @Body() dto: WaiveLibraryFineDto, @CurrentUser() user: AuthenticatedUser) {
    return this.finesService.waiveFine(id, dto, user.id);
  }

  @ApiOperation({ summary: "Cancel Fine" })
  @ApiResponse({ status: 200, description: "Library cancel fine" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("fines/:id/cancel")
  @RequirePermissions("library.fine")
  cancelFine(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.finesService.cancelFine(id, user.id);
  }

  // =========================================================================
  // SUMMARY / DASHBOARD
  // =========================================================================

  @ApiOperation({ summary: "Get Summary" })
  @ApiResponse({ status: 200, description: "Library get summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("library.view")
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @ApiOperation({ summary: "Get Overdue" })
  @ApiResponse({ status: 200, description: "Library get overdue" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("overdue")
  @RequirePermissions("library.view")
  getOverdue() {
    return this.dashboardService.getOverdue();
  }

  @ApiOperation({ summary: "Get Available Books" })
  @ApiResponse({ status: 200, description: "Library get available books" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("available-books")
  @RequirePermissions("library.view")
  getAvailableBooks() {
    return this.dashboardService.getAvailableBooks();
  }

  @ApiOperation({ summary: "Get Popular Books" })
  @ApiResponse({ status: 200, description: "Library get popular books" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("popular-books")
  @RequirePermissions("library.view")
  getPopularBooks() {
    return this.dashboardService.getPopularBooks();
  }

  // PDF Endpoints
  @ApiOperation({ summary: "Print Book" })
  @ApiResponse({ status: 200, description: "Library print book" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("books/:id/print")
  @RequirePermissions("library.print")
  async printBook(@Param("id", ParseCuidPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generateBookPdf(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="book-${id}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @ApiOperation({ summary: "Print Label" })
  @ApiResponse({ status: 200, description: "Library print label" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("copies/:id/label")
  @RequirePermissions("library.print")
  async printLabel(@Param("id", ParseCuidPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generateCopyLabel(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="label-${id}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @ApiOperation({ summary: "Print Receipt" })
  @ApiResponse({ status: 200, description: "Library print receipt" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("loans/:id/receipt")
  @RequirePermissions("library.print")
  async printReceipt(@Param("id", ParseCuidPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generateLoanReceipt(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${id}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @ApiOperation({ summary: "Print Member Card" })
  @ApiResponse({ status: 200, description: "Library print member card" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("members/:id/card")
  @RequirePermissions("library.print")
  async printMemberCard(@Param("id", ParseCuidPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generateMemberCard(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="member-${id}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @ApiOperation({ summary: "Print Summary" })
  @ApiResponse({ status: 200, description: "Library print summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary.pdf")
  @RequirePermissions("library.print")
  async printSummary(@Res() res: Response) {
    const pdfBuffer = await this.pdfService.generateLibrarySummary();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="library-summary.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
