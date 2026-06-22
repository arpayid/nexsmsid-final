import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Res } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import { InventoryItemsService } from "./inventory-items.service";
import { InventoryLoansService } from "./inventory-loans.service";
import { InventoryStockService } from "./inventory-stock.service";
import { InventoryPdfService } from "./inventory-pdf.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/auth.types";
import {
  CreateInventoryCategoryDto,
  UpdateInventoryCategoryDto,
  CreateInventoryLocationDto,
  UpdateInventoryLocationDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateInventoryMovementDto,
  CreateInventoryMaintenanceDto,
  UpdateInventoryMaintenanceDto,
  CreateInventoryLoanDto,
  UpdateInventoryLoanDto,
  InventoryQueryDto,
} from "./inventory.dto";

@Controller("inventory")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Inventory")
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly itemsService: InventoryItemsService,
    private readonly loansService: InventoryLoansService,
    private readonly stockService: InventoryStockService,
    private readonly pdfService: InventoryPdfService,
  ) {}

  // Categories
  @ApiOperation({ summary: "Get Categories" })
  @ApiResponse({ status: 200, description: "Inventory get categories" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("categories")
  @RequirePermissions("inventory.view")
  getCategories() {
    return this.itemsService.getCategories();
  }

  @ApiOperation({ summary: "Create Category" })
  @ApiResponse({ status: 200, description: "Inventory create category" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("categories")
  @RequirePermissions("inventory.create")
  createCategory(@Body() dto: CreateInventoryCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.createCategory(dto, user.id);
  }

  @ApiOperation({ summary: "Get Category" })
  @ApiResponse({ status: 200, description: "Inventory get category" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("categories/:id")
  @RequirePermissions("inventory.view")
  getCategory(@Param("id", ParseCuidPipe) id: string) {
    return this.itemsService.getCategory(id);
  }

  @ApiOperation({ summary: "Update Category" })
  @ApiResponse({ status: 200, description: "Inventory update category" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("categories/:id")
  @RequirePermissions("inventory.update")
  updateCategory(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateInventoryCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.updateCategory(id, dto, user.id);
  }

  @ApiOperation({ summary: "Delete Category" })
  @ApiResponse({ status: 200, description: "Inventory delete category" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("categories/:id")
  @RequirePermissions("inventory.delete")
  deleteCategory(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.deleteCategory(id, user.id);
  }

  // Locations
  @ApiOperation({ summary: "Get Locations" })
  @ApiResponse({ status: 200, description: "Inventory get locations" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("locations")
  @RequirePermissions("inventory.view")
  getLocations() {
    return this.itemsService.getLocations();
  }

  @ApiOperation({ summary: "Create Location" })
  @ApiResponse({ status: 200, description: "Inventory create location" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("locations")
  @RequirePermissions("inventory.create")
  createLocation(@Body() dto: CreateInventoryLocationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.createLocation(dto, user.id);
  }

  @ApiOperation({ summary: "Get Location" })
  @ApiResponse({ status: 200, description: "Inventory get location" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("locations/:id")
  @RequirePermissions("inventory.view")
  getLocation(@Param("id", ParseCuidPipe) id: string) {
    return this.itemsService.getLocation(id);
  }

  @ApiOperation({ summary: "Update Location" })
  @ApiResponse({ status: 200, description: "Inventory update location" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("locations/:id")
  @RequirePermissions("inventory.update")
  updateLocation(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateInventoryLocationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.updateLocation(id, dto, user.id);
  }

  @ApiOperation({ summary: "Delete Location" })
  @ApiResponse({ status: 200, description: "Inventory delete location" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("locations/:id")
  @RequirePermissions("inventory.delete")
  deleteLocation(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.deleteLocation(id, user.id);
  }

  // Items
  @ApiOperation({ summary: "Get Items" })
  @ApiResponse({ status: 200, description: "Inventory get items" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("items")
  @RequirePermissions("inventory.view")
  getItems(@Query() query: InventoryQueryDto) {
    return this.itemsService.getItems(query);
  }

  @ApiOperation({ summary: "Create Item" })
  @ApiResponse({ status: 200, description: "Inventory create item" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("items")
  @RequirePermissions("inventory.create")
  createItem(@Body() dto: CreateInventoryItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.createItem(dto, user.id);
  }

  @ApiOperation({ summary: "Get Item" })
  @ApiResponse({ status: 200, description: "Inventory get item" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("items/:id")
  @RequirePermissions("inventory.view")
  getItem(@Param("id", ParseCuidPipe) id: string) {
    return this.itemsService.getItem(id);
  }

  @ApiOperation({ summary: "Update Item" })
  @ApiResponse({ status: 200, description: "Inventory update item" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("items/:id")
  @RequirePermissions("inventory.update")
  updateItem(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateInventoryItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.updateItem(id, dto, user.id);
  }

  @ApiOperation({ summary: "Delete Item" })
  @ApiResponse({ status: 200, description: "Inventory delete item" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("items/:id")
  @RequirePermissions("inventory.delete")
  deleteItem(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.deleteItem(id, user.id);
  }

  @ApiOperation({ summary: "Get Item Movements" })
  @ApiResponse({ status: 200, description: "Inventory get item movements" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("items/:id/movements")
  @RequirePermissions("inventory.view")
  getItemMovements(@Param("id", ParseCuidPipe) id: string) {
    return this.itemsService.getItemMovements(id);
  }

  // Movements
  @ApiOperation({ summary: "Get Movements" })
  @ApiResponse({ status: 200, description: "Inventory get movements" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("movements")
  @RequirePermissions("inventory.view")
  getMovements(@Query() query: InventoryQueryDto) {
    return this.itemsService.getMovements(query);
  }

  @ApiOperation({ summary: "Create Movement" })
  @ApiResponse({ status: 200, description: "Inventory create movement" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("movements")
  @RequirePermissions("inventory.transfer")
  createMovement(@Body() dto: CreateInventoryMovementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.createMovement(dto, user.id);
  }

  // Maintenance
  @ApiOperation({ summary: "Get Maintenances" })
  @ApiResponse({ status: 200, description: "Inventory get maintenances" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("maintenances")
  @RequirePermissions("inventory.maintenance")
  getMaintenances(@Query() query: InventoryQueryDto) {
    return this.itemsService.getMaintenances(query);
  }

  @ApiOperation({ summary: "Create Maintenance" })
  @ApiResponse({ status: 200, description: "Inventory create maintenance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("maintenances")
  @RequirePermissions("inventory.maintenance")
  createMaintenance(@Body() dto: CreateInventoryMaintenanceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.createMaintenance(dto, user.id);
  }

  @ApiOperation({ summary: "Get Maintenance" })
  @ApiResponse({ status: 200, description: "Inventory get maintenance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("maintenances/:id")
  @RequirePermissions("inventory.maintenance")
  getMaintenance(@Param("id", ParseCuidPipe) id: string) {
    return this.itemsService.getMaintenance(id);
  }

  @ApiOperation({ summary: "Update Maintenance" })
  @ApiResponse({ status: 200, description: "Inventory update maintenance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("maintenances/:id")
  @RequirePermissions("inventory.maintenance")
  updateMaintenance(
    @Param("id", ParseCuidPipe) id: string,
    @Body() dto: UpdateInventoryMaintenanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.itemsService.updateMaintenance(id, dto, user.id);
  }

  @ApiOperation({ summary: "Start Maintenance" })
  @ApiResponse({ status: 200, description: "Inventory start maintenance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("maintenances/:id/start")
  @RequirePermissions("inventory.maintenance")
  startMaintenance(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.startMaintenance(id, user.id);
  }

  @ApiOperation({ summary: "Complete Maintenance" })
  @ApiResponse({ status: 200, description: "Inventory complete maintenance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("maintenances/:id/complete")
  @RequirePermissions("inventory.maintenance")
  completeMaintenance(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.completeMaintenance(id, user.id);
  }

  @ApiOperation({ summary: "Cancel Maintenance" })
  @ApiResponse({ status: 200, description: "Inventory cancel maintenance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("maintenances/:id/cancel")
  @RequirePermissions("inventory.maintenance")
  cancelMaintenance(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.cancelMaintenance(id, user.id);
  }

  @ApiOperation({ summary: "Delete Maintenance" })
  @ApiResponse({ status: 200, description: "Inventory delete maintenance" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("maintenances/:id")
  @RequirePermissions("inventory.maintenance")
  deleteMaintenance(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.deleteMaintenance(id, user.id);
  }

  // Loans
  @ApiOperation({ summary: "Get Loans" })
  @ApiResponse({ status: 200, description: "Inventory get loans" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("loans")
  @RequirePermissions("inventory.view")
  getLoans(@Query() query: InventoryQueryDto) {
    return this.loansService.getLoans(query);
  }

  @ApiOperation({ summary: "Create Loan" })
  @ApiResponse({ status: 200, description: "Inventory create loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans")
  @RequirePermissions("inventory.borrow")
  createLoan(@Body() dto: CreateInventoryLoanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.createLoan(dto, user.id);
  }

  @ApiOperation({ summary: "Get Loan" })
  @ApiResponse({ status: 200, description: "Inventory get loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("loans/:id")
  @RequirePermissions("inventory.view")
  getLoan(@Param("id", ParseCuidPipe) id: string) {
    return this.loansService.getLoan(id);
  }

  @ApiOperation({ summary: "Update Loan" })
  @ApiResponse({ status: 200, description: "Inventory update loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("loans/:id")
  @RequirePermissions("inventory.update")
  updateLoan(@Param("id", ParseCuidPipe) id: string, @Body() dto: UpdateInventoryLoanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.updateLoan(id, dto, user.id);
  }

  @ApiOperation({ summary: "Approve Loan" })
  @ApiResponse({ status: 200, description: "Inventory approve loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans/:id/approve")
  @RequirePermissions("inventory.approve-loan")
  approveLoan(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.approveLoan(id, user.id);
  }

  @ApiOperation({ summary: "Reject Loan" })
  @ApiResponse({ status: 200, description: "Inventory reject loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans/:id/reject")
  @RequirePermissions("inventory.approve-loan")
  rejectLoan(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.rejectLoan(id, user.id);
  }

  @ApiOperation({ summary: "Mark Loan Borrowed" })
  @ApiResponse({ status: 200, description: "Inventory mark loan borrowed" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans/:id/mark-borrowed")
  @RequirePermissions("inventory.borrow")
  markLoanBorrowed(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.markLoanBorrowed(id, user.id);
  }

  @ApiOperation({ summary: "Return Loan" })
  @ApiResponse({ status: 200, description: "Inventory return loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans/:id/return")
  @RequirePermissions("inventory.return")
  returnLoan(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.returnLoan(id, user.id);
  }

  @ApiOperation({ summary: "Cancel Loan" })
  @ApiResponse({ status: 200, description: "Inventory cancel loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("loans/:id/cancel")
  @RequirePermissions("inventory.borrow")
  cancelLoan(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.cancelLoan(id, user.id);
  }

  @ApiOperation({ summary: "Delete Loan" })
  @ApiResponse({ status: 200, description: "Inventory delete loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("loans/:id")
  @RequirePermissions("inventory.delete")
  deleteLoan(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.loansService.deleteLoan(id, user.id);
  }

  // Summary & Dashboard
  @ApiOperation({ summary: "Get Summary" })
  @ApiResponse({ status: 200, description: "Inventory get summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("inventory.view")
  getSummary() {
    return this.stockService.getSummary();
  }

  @ApiOperation({ summary: "Get Low Stock Items" })
  @ApiResponse({ status: 200, description: "Inventory get low stock items" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("reports/low-stock")
  @RequirePermissions("inventory.view")
  getLowStockItems() {
    return this.stockService.getLowStockItems();
  }

  @ApiOperation({ summary: "Get Maintenance Due" })
  @ApiResponse({ status: 200, description: "Inventory get maintenance due" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("reports/maintenance-due")
  @RequirePermissions("inventory.maintenance")
  getMaintenanceDue() {
    return this.stockService.getMaintenanceDue();
  }

  @ApiOperation({ summary: "Get Loans Overdue" })
  @ApiResponse({ status: 200, description: "Inventory get loans overdue" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("reports/loans-overdue")
  @RequirePermissions("inventory.view")
  getLoansOverdue() {
    return this.stockService.getLoansOverdue();
  }

  // PDFs
  @ApiOperation({ summary: "Print Item" })
  @ApiResponse({ status: 200, description: "Inventory print item" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("items/:id/print")
  @RequirePermissions("inventory.print")
  async printItem(@Param("id", ParseCuidPipe) id: string, @Res() res: Response) {
    const buffer = await this.pdfService.generateItemPdf(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="item-${id}.pdf"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }

  @ApiOperation({ summary: "Print Item Label" })
  @ApiResponse({ status: 200, description: "Inventory print item label" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("items/:id/label")
  @RequirePermissions("inventory.print")
  async printItemLabel(@Param("id", ParseCuidPipe) id: string, @Res() res: Response) {
    const buffer = await this.pdfService.generateItemLabelPdf(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="label-${id}.pdf"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }

  @ApiOperation({ summary: "Print Loan" })
  @ApiResponse({ status: 200, description: "Inventory print loan" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("loans/:id/print")
  @RequirePermissions("inventory.print")
  async printLoan(@Param("id", ParseCuidPipe) id: string, @Res() res: Response) {
    const buffer = await this.pdfService.generateLoanPdf(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="loan-${id}.pdf"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }

  @ApiOperation({ summary: "Print Summary" })
  @ApiResponse({ status: 200, description: "Inventory print summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary.pdf")
  @RequirePermissions("inventory.print")
  async printSummary(@Res() res: Response) {
    const buffer = await this.pdfService.generateSummaryPdf();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inventory-summary.pdf"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }
}
