import { Body, Controller, Delete, Get, Header, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";
import type { Response } from "express";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { PrintDocumentService } from "../pdf/print-document.service";
import { createInvoiceSchema, updateInvoiceSchema } from "./invoices.dto";
import { InvoicesService } from "./invoices.service";

@Controller("invoices")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Invoices")
@ApiBearerAuth()
export class InvoicesController {
  constructor(
    @Inject(InvoicesService) private readonly service: InvoicesService,
    @Inject(PrintDocumentService) private readonly printService: PrintDocumentService,
  ) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Invoices list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("invoices.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Invoices retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Invoices find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("invoices.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Invoice retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Invoices create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("invoices.create")
  async create(
    @Body(new ZodValidationPipe(createInvoiceSchema.strict())) body: z.infer<typeof createInvoiceSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Invoice created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Invoices update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("invoices.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateInvoiceSchema.strict())) body: z.infer<typeof updateInvoiceSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Invoice updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Invoices delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("invoices.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Invoice deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Issue" })
  @ApiResponse({ status: 200, description: "Invoices issue" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/issue")
  @RequirePermissions("invoices.issue")
  async issue(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Invoice issued", await this.service.issue(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Cancel" })
  @ApiResponse({ status: 200, description: "Invoices cancel" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/cancel")
  @RequirePermissions("invoices.cancel")
  async cancel(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Invoice cancelled", await this.service.cancel(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Download Pdf" })
  @ApiResponse({ status: 200, description: "Invoices download pdf" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/pdf")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("invoices.print")
  async downloadPdf(
    @Param("id", ParseCuidPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const invoice = await this.service.findById(id);
    const buffer = await this.printService.renderInvoice(id);
    await this.printService.logPrint("invoice.print", "invoice", id, user, getRequestMeta(request), {
      invoiceNumber: invoice.invoiceNumber,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.end(buffer);
  }
}
