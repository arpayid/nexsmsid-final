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
import { createIndustryPartnerSchema, updateIndustryPartnerSchema } from "./industry-partners.dto";
import { IndustryPartnersService } from "./industry-partners.service";

@Controller("industry-partners")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Industry Partners")
@ApiBearerAuth()
export class IndustryPartnersController {
  constructor(@Inject(IndustryPartnersService) private readonly service: IndustryPartnersService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Industry Partners list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("industry-partners.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Industry partners retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Industry Partners find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("industry-partners.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Industry partner retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Industry Partners create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("industry-partners.create")
  async create(
    @Body(new ZodValidationPipe(createIndustryPartnerSchema.strict())) body: z.infer<typeof createIndustryPartnerSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Industry partner created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Industry Partners update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("industry-partners.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateIndustryPartnerSchema.strict())) body: z.infer<typeof updateIndustryPartnerSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Industry partner updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Industry Partners delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("industry-partners.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Industry partner deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }
}
