import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { Public } from "./auth/decorators/public.decorator";
import { apiSuccess } from "./common/api-response";

@Controller()
@Public()
@ApiTags("App")
export class AppController {
  @ApiOperation({ summary: "Get Root" })
  @ApiResponse({ status: 200, description: "App get root" })
  @Get()
  getRoot() {
    return apiSuccess("NexSMSID API is running", {
      name: "NexSMSID API",
      status: "ok",
      health: "/api/v1/health",
      version: "/api/v1/version",
    });
  }
}
