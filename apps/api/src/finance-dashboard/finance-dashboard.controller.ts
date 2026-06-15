import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { FinanceDashboardService } from "./finance-dashboard.service";

@Controller("finance")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Finance Dashboard")
@ApiBearerAuth()
export class FinanceDashboardController {
  constructor(@Inject(FinanceDashboardService) private readonly service: FinanceDashboardService) {}

  @ApiOperation({ summary: "Summary" })
  @ApiResponse({ status: 200, description: "Finance Dashboard summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("finance.view")
  async summary() {
    return apiSuccess("Finance summary retrieved", await this.service.summary());
  }

  @ApiOperation({ summary: "Cashflow" })
  @ApiResponse({ status: 200, description: "Finance Dashboard cashflow" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("cashflow")
  @RequirePermissions("finance.view")
  async cashflow() {
    return apiSuccess("Finance cashflow retrieved", await this.service.cashflow());
  }

  @ApiOperation({ summary: "Outstanding" })
  @ApiResponse({ status: 200, description: "Finance Dashboard outstanding" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("outstanding")
  @RequirePermissions("finance.view")
  async outstanding() {
    return apiSuccess("Outstanding invoices retrieved", await this.service.outstanding());
  }
}
