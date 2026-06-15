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
import { createNotificationTemplateSchema, updateNotificationTemplateSchema } from "./notification-templates.dto";
import { NotificationTemplatesService } from "./notification-templates.service";

@Controller("notification-templates")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Notification Templates")
@ApiBearerAuth()
export class NotificationTemplatesController {
  constructor(@Inject(NotificationTemplatesService) private readonly service: NotificationTemplatesService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Notification Templates list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("notification-templates.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Notification templates retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Notification Templates create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("notification-templates.create")
  async create(
    @Body(new ZodValidationPipe(createNotificationTemplateSchema.strict())) body: z.infer<typeof createNotificationTemplateSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Notification template created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Notification Templates find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("notification-templates.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Notification template retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Notification Templates update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("notification-templates.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateNotificationTemplateSchema.strict())) body: z.infer<typeof updateNotificationTemplateSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Notification template updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Notification Templates delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("notification-templates.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Notification template deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }
}
