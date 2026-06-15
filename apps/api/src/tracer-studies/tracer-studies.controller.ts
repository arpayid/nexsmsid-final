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
import { createTracerStudySchema, updateTracerStudySchema } from "./tracer-studies.dto";
import { TracerStudiesService } from "./tracer-studies.service";

@Controller("tracer-studies")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Tracer Studies")
@ApiBearerAuth()
export class TracerStudiesController {
  constructor(@Inject(TracerStudiesService) private readonly service: TracerStudiesService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Tracer Studies list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("tracer-studies.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Tracer studies retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Tracer Studies create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("tracer-studies.create")
  async create(
    @Body(new ZodValidationPipe(createTracerStudySchema.strict())) body: z.infer<typeof createTracerStudySchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Tracer study created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Tracer Studies find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("tracer-studies.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Tracer study retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Tracer Studies update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("tracer-studies.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateTracerStudySchema.strict())) body: z.infer<typeof updateTracerStudySchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Tracer study updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Tracer Studies delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("tracer-studies.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Tracer study deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }
}
