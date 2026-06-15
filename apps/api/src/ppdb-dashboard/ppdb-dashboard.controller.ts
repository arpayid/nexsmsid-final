import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { PpdbDashboardService } from "./ppdb-dashboard.service";

@Controller("ppdb")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Ppdb Dashboard")
@ApiBearerAuth()
export class PpdbDashboardController {
  constructor(@Inject(PpdbDashboardService) private readonly service: PpdbDashboardService) {}

  @ApiOperation({ summary: "Summary" })
  @ApiResponse({ status: 200, description: "Ppdb Dashboard summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("ppdb.view")
  async summary() {
    return apiSuccess("PPDB summary retrieved", await this.service.summary());
  }

  @ApiOperation({ summary: "Status Chart" })
  @ApiResponse({ status: 200, description: "Ppdb Dashboard status chart" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("status-chart")
  @RequirePermissions("ppdb.view")
  async statusChart() {
    return apiSuccess("PPDB status chart retrieved", await this.service.statusChart());
  }
}
