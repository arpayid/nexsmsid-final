import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { createExpenseSchema, updateExpenseSchema } from "./expenses.dto";
import { ExpensesService } from "./expenses.service";

@Controller("expenses")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Expenses")
@ApiBearerAuth()
export class ExpensesController {
  constructor(@Inject(ExpensesService) private readonly service: ExpensesService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Expenses list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("expenses.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Expenses retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Expenses find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("expenses.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Expense retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Expenses create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("expenses.create")
  async create(
    @Body(new ZodValidationPipe(createExpenseSchema.strict())) body: z.infer<typeof createExpenseSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Expense created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Expenses update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("expenses.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateExpenseSchema.strict())) body: z.infer<typeof updateExpenseSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Expense updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Expenses delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("expenses.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Expense deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Approve" })
  @ApiResponse({ status: 200, description: "Expenses approve" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/approve")
  @RequirePermissions("expenses.approve")
  async approve(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Expense approved", await this.service.approve(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Mark Paid" })
  @ApiResponse({ status: 200, description: "Expenses mark paid" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/mark-paid")
  @RequirePermissions("expenses.pay")
  async markPaid(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Expense marked paid", await this.service.markPaid(id, user, getRequestMeta(request)));
  }
}
