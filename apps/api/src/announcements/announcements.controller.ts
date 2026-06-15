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
import { Public } from "../auth/decorators/public.decorator";
import { apiSuccess } from "../common/api-response";
import { createAnnouncementSchema, updateAnnouncementSchema } from "./announcements.dto";
import { AnnouncementsService } from "./announcements.service";

@Controller("announcements")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Announcements")
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(@Inject(AnnouncementsService) private readonly service: AnnouncementsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Announcements list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("announcements.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Announcements retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Announcements create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("announcements.create")
  async create(
    @Body(new ZodValidationPipe(createAnnouncementSchema.strict())) body: z.infer<typeof createAnnouncementSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Announcement created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Announcements find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("announcements.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Announcement retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Announcements update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("announcements.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateAnnouncementSchema.strict())) body: z.infer<typeof updateAnnouncementSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Announcement updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Announcements delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("announcements.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Announcement deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Publish" })
  @ApiResponse({ status: 200, description: "Announcements publish" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/publish")
  @RequirePermissions("announcements.publish")
  async publish(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Announcement published", await this.service.publish(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Archive" })
  @ApiResponse({ status: 200, description: "Announcements archive" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/archive")
  @RequirePermissions("announcements.archive")
  async archive(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Announcement archived", await this.service.archive(id, user, getRequestMeta(request)));
  }
}

@Controller("public/announcements")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Public()
@ApiTags("Announcements")
@ApiBearerAuth()
export class PublicAnnouncementsController {
  constructor(@Inject(AnnouncementsService) private readonly service: AnnouncementsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Announcements list" })
  @Get()
  async list(@Query() query: unknown) {
    const result = await this.service.publicList(query);
    return apiSuccess("Public announcements retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Announcements find by id" })
  @Get(":id")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Public announcement retrieved", await this.service.publicFindById(id));
  }
}
