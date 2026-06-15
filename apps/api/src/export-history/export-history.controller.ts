import { Controller, Get, Inject, Param, Query, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { ExportHistoryService } from "./export-history.service";

@Controller("export-history")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Export History")
@ApiBearerAuth()
export class ExportHistoryController {
  constructor(@Inject(ExportHistoryService) private readonly service: ExportHistoryService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Export History list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("export-history.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Export history retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Export History find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("export-history.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Export history item retrieved", await this.service.findById(id));
  }
}
