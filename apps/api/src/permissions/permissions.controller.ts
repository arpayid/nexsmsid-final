import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { PermissionsService } from "./permissions.service";

@Controller("permissions")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Permissions")
@ApiBearerAuth()
export class PermissionsController {
  constructor(@Inject(PermissionsService) private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Permissions list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("permissions.view")
  async list() {
    const result = await this.permissionsService.list();
    return apiSuccess("Permissions retrieved", result.items, { total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Permissions find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("permissions.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Permission retrieved", await this.permissionsService.findById(id));
  }
}
