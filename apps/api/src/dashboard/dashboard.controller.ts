import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions("dashboard.view")
@ApiTags("Dashboard")
@ApiBearerAuth()
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: "Get Summary" })
  @ApiResponse({ status: 200, description: "Dashboard get summary" })
  @Get("summary")
  async getSummary() {
    return apiSuccess("Dashboard summary retrieved", await this.dashboardService.getSummary());
  }

  @ApiOperation({ summary: "Get User Role Summary" })
  @ApiResponse({ status: 200, description: "Dashboard get user role summary" })
  @Get("user-role-summary")
  async getUserRoleSummary() {
    return apiSuccess("Dashboard user role summary retrieved", await this.dashboardService.getUserRoleSummary());
  }

  @ApiOperation({ summary: "Get Recent Activities" })
  @ApiResponse({ status: 200, description: "Dashboard get recent activities" })
  @Get("recent-activities")
  async getRecentActivities() {
    return apiSuccess("Dashboard recent activities retrieved", await this.dashboardService.getRecentActivities());
  }

  @ApiOperation({ summary: "Get System Status" })
  @ApiResponse({ status: 200, description: "Dashboard get system status" })
  @Get("system-status")
  async getSystemStatus() {
    return apiSuccess("Dashboard system status retrieved", await this.dashboardService.getSystemStatus());
  }

  // Phase 10.5 — Dashboard Enhancement
  @ApiOperation({ summary: "Get Overview" })
  @ApiResponse({ status: 200, description: "Dashboard get overview" })
  @Get("overview")
  async getOverview() {
    return apiSuccess("Dashboard overview retrieved", await this.dashboardService.getOverview());
  }

  @ApiOperation({ summary: "Get Academic Summary" })
  @ApiResponse({ status: 200, description: "Dashboard get academic summary" })
  @Get("academic-summary")
  async getAcademicSummary() {
    return apiSuccess("Dashboard academic summary retrieved", await this.dashboardService.getAcademicSummary());
  }

  @ApiOperation({ summary: "Get Finance Summary" })
  @ApiResponse({ status: 200, description: "Dashboard get finance summary" })
  @Get("finance-summary")
  async getFinanceSummary() {
    return apiSuccess("Dashboard finance summary retrieved", await this.dashboardService.getFinanceSummary());
  }

  @ApiOperation({ summary: "Get Ppdb Summary" })
  @ApiResponse({ status: 200, description: "Dashboard get ppdb summary" })
  @Get("ppdb-summary")
  async getPpdbSummary() {
    return apiSuccess("Dashboard PPDB summary retrieved", await this.dashboardService.getPpdbSummary());
  }

  @ApiOperation({ summary: "Get People Summary" })
  @ApiResponse({ status: 200, description: "Dashboard get people summary" })
  @Get("people-summary")
  async getPeopleSummary() {
    return apiSuccess("Dashboard people summary retrieved", await this.dashboardService.getPeopleSummary());
  }

  @ApiOperation({ summary: "Get Activity Feed" })
  @ApiResponse({ status: 200, description: "Dashboard get activity feed" })
  @Get("activity-feed")
  async getActivityFeed() {
    return apiSuccess("Dashboard activity feed retrieved", await this.dashboardService.getActivityFeed());
  }

  @ApiOperation({ summary: "Get Quick Alerts" })
  @ApiResponse({ status: 200, description: "Dashboard get quick alerts" })
  @Get("quick-alerts")
  async getQuickAlerts() {
    return apiSuccess("Dashboard quick alerts retrieved", await this.dashboardService.getQuickAlerts());
  }
}
