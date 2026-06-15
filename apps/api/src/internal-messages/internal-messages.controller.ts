import { Body, Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
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
import { sendMessageSchema } from "./internal-messages.dto";
import { InternalMessagesService } from "./internal-messages.service";

@Controller("internal-messages")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Internal Messages")
@ApiBearerAuth()
export class InternalMessagesController {
  constructor(@Inject(InternalMessagesService) private readonly service: InternalMessagesService) {}

  @ApiOperation({ summary: "Inbox" })
  @ApiResponse({ status: 200, description: "Internal Messages inbox" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("inbox")
  @RequirePermissions("messages.view")
  async inbox(@Query() query: unknown, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.inbox(query, user);
    return apiSuccess("Inbox messages retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Sent" })
  @ApiResponse({ status: 200, description: "Internal Messages sent" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("sent")
  @RequirePermissions("messages.view")
  async sent(@Query() query: unknown, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.sent(query, user);
    return apiSuccess("Sent messages retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Send" })
  @ApiResponse({ status: 200, description: "Internal Messages send" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("messages.send")
  async send(
    @Body(new ZodValidationPipe(sendMessageSchema.strict())) body: z.infer<typeof sendMessageSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Message sent", await this.service.send(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Internal Messages find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("messages.view")
  async findById(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Message retrieved", await this.service.findById(id, user));
  }

  @ApiOperation({ summary: "Mark Read" })
  @ApiResponse({ status: 200, description: "Internal Messages mark read" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/read")
  @RequirePermissions("messages.read")
  async markRead(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Message marked as read", await this.service.markRead(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Internal Messages delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("messages.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Message deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }
}
