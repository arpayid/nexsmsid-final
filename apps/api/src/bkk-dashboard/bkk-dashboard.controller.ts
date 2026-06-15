import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { BkkDashboardService } from "./bkk-dashboard.service";

@Controller("bkk")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Bkk Dashboard")
@ApiBearerAuth()
export class BkkDashboardController {
  constructor(@Inject(BkkDashboardService) private readonly service: BkkDashboardService) {}

  @ApiOperation({ summary: "Summary" })
  @ApiResponse({ status: 200, description: "Bkk Dashboard summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("bkk.view")
  async summary() {
    return apiSuccess("BKK summary retrieved", await this.service.summary());
  }

  @ApiOperation({ summary: "Job Status Chart" })
  @ApiResponse({ status: 200, description: "Bkk Dashboard job status chart" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("job-status-chart")
  @RequirePermissions("bkk.view")
  async jobStatusChart() {
    return apiSuccess("BKK job status chart retrieved", await this.service.jobStatusChart());
  }

  @ApiOperation({ summary: "Alumni Status Chart" })
  @ApiResponse({ status: 200, description: "Bkk Dashboard alumni status chart" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("alumni-status-chart")
  @RequirePermissions("bkk.view")
  async alumniStatusChart() {
    return apiSuccess("BKK alumni status chart retrieved", await this.service.alumniStatusChart());
  }
}
