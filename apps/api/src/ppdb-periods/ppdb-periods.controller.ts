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
import { createPpdbPeriodSchema, updatePpdbPeriodSchema } from "./ppdb-periods.dto";
import { PpdbPeriodsService } from "./ppdb-periods.service";

@Controller("ppdb/periods")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Ppdb Periods")
@ApiBearerAuth()
export class PpdbPeriodsController {
  constructor(@Inject(PpdbPeriodsService) private readonly service: PpdbPeriodsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Ppdb Periods list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("ppdb.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("PPDB periods retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Ppdb Periods find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("ppdb.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("PPDB period retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Ppdb Periods create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("ppdb.create")
  async create(
    @Body(new ZodValidationPipe(createPpdbPeriodSchema.strict())) body: z.infer<typeof createPpdbPeriodSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("PPDB period created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Ppdb Periods update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("ppdb.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updatePpdbPeriodSchema.strict())) body: z.infer<typeof updatePpdbPeriodSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("PPDB period updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Ppdb Periods delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("ppdb.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("PPDB period deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }
}
