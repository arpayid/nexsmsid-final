import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { AllowAuthenticated } from "../auth/decorators/allow-authenticated.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { apiSuccess } from "../common/api-response";
import { HealthService } from "./health.service";

@Controller()
@ApiTags("Health")
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @ApiOperation({ summary: "Get Root Health" })
  @ApiResponse({ status: 200, description: "Health get root health" })
  @Public()
  @Get("health")
  getRootHealth() {
    return apiSuccess("Health check OK", this.healthService.getBasicHealth());
  }

  @ApiOperation({ summary: "Get Prefixed Health" })
  @ApiResponse({ status: 200, description: "Health get prefixed health" })
  @Public()
  @Get("api/v1/health")
  getPrefixedHealth() {
    return apiSuccess("Health check OK", this.healthService.getBasicHealth());
  }

  @ApiOperation({ summary: "Get Detailed Root Health" })
  @ApiResponse({ status: 200, description: "Detailed health check with dependency status" })
  @ApiBearerAuth()
  @AllowAuthenticated()
  @Get("health/detailed")
  async getRootDetailedHealth() {
    return apiSuccess("Detailed health check OK", await this.healthService.getDetailedHealth());
  }

  @ApiOperation({ summary: "Get Detailed Prefixed Health" })
  @ApiResponse({ status: 200, description: "Detailed health check with dependency status" })
  @ApiBearerAuth()
  @AllowAuthenticated()
  @Get("api/v1/health/detailed")
  async getPrefixedDetailedHealth() {
    return apiSuccess("Detailed health check OK", await this.healthService.getDetailedHealth());
  }

  @ApiOperation({ summary: "Get Version" })
  @ApiResponse({ status: 200, description: "Health get version" })
  @ApiBearerAuth()
  @AllowAuthenticated()
  @Get("version")
  getVersion() {
    return apiSuccess("Version retrieved", this.healthService.getVersion());
  }
}
