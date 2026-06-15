import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { createUserSchema, forceChangePasswordSchema, resetPasswordSchema, updateUserSchema } from "./users.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Users")
@ApiBearerAuth()
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "List Users" })
  @ApiResponse({ status: 200, description: "Paginated list of users retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("users.view")
  async list() {
    const result = await this.usersService.list();
    return apiSuccess("Users retrieved", result.items, { total: result.total });
  }

  @ApiOperation({ summary: "Create User" })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "User created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("users.create")
  async create(
    @Body(new ZodValidationPipe(createUserSchema.strict())) body: z.infer<typeof createUserSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("User created", await this.usersService.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find User By ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "User retrieved by ID" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Get(":id")
  @RequirePermissions("users.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("User retrieved", await this.usersService.findById(id));
  }

  @ApiOperation({ summary: "Update User" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Patch(":id")
  @RequirePermissions("users.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateUserSchema.strict())) body: z.infer<typeof updateUserSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("User updated", await this.usersService.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete User" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "User soft-deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Delete(":id")
  @RequirePermissions("users.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("User deleted", await this.usersService.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reset User Password" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "User password reset successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Post(":id/reset-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @RequirePermissions("users.reset-password")
  async resetPassword(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(resetPasswordSchema.strict())) body: z.infer<typeof resetPasswordSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("User password reset successfully", await this.usersService.resetPassword(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Unlock User" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "User unlocked successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Post(":id/unlock")
  @RequirePermissions("users.unlock")
  async unlock(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("User unlocked successfully", await this.usersService.unlockUser(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Force User Change Password" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "User force change password flag updated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Post(":id/force-change-password")
  @RequirePermissions("users.force-change-password")
  async forceChangePassword(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(forceChangePasswordSchema.strict())) body: z.infer<typeof forceChangePasswordSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess(
      "User force change password updated",
      await this.usersService.forceChangePassword(id, body, user, getRequestMeta(request)),
    );
  }
}
