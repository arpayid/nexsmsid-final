import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
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
import { createNotificationSchema } from "./notifications.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Notifications")
@ApiBearerAuth()
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly service: NotificationsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Notifications list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("notifications.view")
  async list(@Query() query: unknown, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.list(query, user);
    return apiSuccess("Notifications retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Unread Count" })
  @ApiResponse({ status: 200, description: "Notifications unread count" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("unread-count")
  @RequirePermissions("notifications.view")
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Unread notification count retrieved", await this.service.unreadCount(user));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Notifications create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("notifications.create")
  async create(
    @Body(new ZodValidationPipe(createNotificationSchema.strict())) body: z.infer<typeof createNotificationSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Notification created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Mark All Read" })
  @ApiResponse({ status: 200, description: "Notifications mark all read" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("read-all")
  @RequirePermissions("notifications.read")
  async markAllRead(@CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Notifications marked as read", await this.service.markAllRead(user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Mark Read" })
  @ApiResponse({ status: 200, description: "Notifications mark read" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/read")
  @RequirePermissions("notifications.read")
  async markRead(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Notification marked as read", await this.service.markRead(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Archive" })
  @ApiResponse({ status: 200, description: "Notifications archive" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/archive")
  @RequirePermissions("notifications.archive")
  async archive(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Notification archived", await this.service.archive(id, user, getRequestMeta(request)));
  }
}
