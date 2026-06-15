import { Body, Controller, Get, Header, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
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
import { createPaymentSchema, rejectPaymentSchema, updatePaymentSchema, verifyPaymentSchema } from "./payments.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Payments")
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    @Inject(PaymentsService) private readonly service: PaymentsService,
    @Inject(PrintDocumentService) private readonly printService: PrintDocumentService,
  ) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Payments list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("payments.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Payments retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Payments find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("payments.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Payment retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Payments create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("payments.create")
  async create(
    @Body(new ZodValidationPipe(createPaymentSchema.strict())) body: z.infer<typeof createPaymentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Payment created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Payments update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("payments.create")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updatePaymentSchema.strict())) body: z.infer<typeof updatePaymentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Payment updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Verify" })
  @ApiResponse({ status: 200, description: "Payments verify" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/verify")
  @RequirePermissions("payments.verify")
  async verify(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(verifyPaymentSchema.strict())) body: z.infer<typeof verifyPaymentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Payment verified", await this.service.verify(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reject" })
  @ApiResponse({ status: 200, description: "Payments reject" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/reject")
  @RequirePermissions("payments.reject")
  async reject(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(rejectPaymentSchema.strict())) body: z.infer<typeof rejectPaymentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Payment rejected", await this.service.reject(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Cancel" })
  @ApiResponse({ status: 200, description: "Payments cancel" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/cancel")
  @RequirePermissions("payments.cancel")
  async cancel(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Payment cancelled", await this.service.cancel(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Download Receipt" })
  @ApiResponse({ status: 200, description: "Payments download receipt" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/receipt.pdf")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("payments.print")
  async downloadReceipt(
    @Param("id", ParseCuidPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const payment = await this.service.findById(id);
    const buffer = await this.printService.renderPaymentReceipt(id);
    await this.printService.logPrint("payment.receipt.print", "payment", id, user, getRequestMeta(request), {
      paymentNumber: payment.paymentNumber,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="receipt-${payment.paymentNumber}.pdf"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.end(buffer);
  }
}
