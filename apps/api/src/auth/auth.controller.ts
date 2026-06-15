import { BadRequestException, Body, Controller, Get, Inject, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";

import { z } from "zod";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { apiSuccess } from "../common/api-response";
import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "./auth.types";
import { changePasswordSchema, loginSchema, logoutSchema, refreshSchema } from "./auth.dto";
import { AuthCookieService } from "./auth-cookie.service";
import { readRefreshTokenFromRequest } from "./auth-cookies";
import { AuthService } from "./auth.service";
import { AllowAuthenticated } from "./decorators/allow-authenticated.decorator";
import { AllowPendingPasswordChange } from "./decorators/allow-pending-password-change.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { RequirePermissions } from "./decorators/require-permissions.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionGuard } from "./guards/permission.guard";

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(AuthCookieService) private readonly authCookieService: AuthCookieService,
  ) {}

  @ApiOperation({ summary: "Login" })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "Login successful — sets httpOnly auth cookies and returns user profile" })
  @ApiResponse({ status: 429, description: "Too many requests — rate limited" })
  @Post("login")
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginSchema.strict())) body: z.infer<typeof loginSchema>,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body, getRequestMeta(request));
    this.authCookieService.attachAuthCookies(res, result);
    return apiSuccess("Login successful", this.authCookieService.sanitizeAuthResponse(result));
  }

  @ApiOperation({ summary: "Refresh Token" })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  @ApiResponse({ status: 429, description: "Too many requests — rate limited" })
  @Post("refresh")
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema.strict())) body: z.infer<typeof refreshSchema>,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = readRefreshTokenFromRequest(request.cookies ?? {}, body);
    if (!refreshToken) {
      throw new BadRequestException("Missing refresh token");
    }

    const result = await this.authService.refresh({ refreshToken }, getRequestMeta(request));
    this.authCookieService.attachAuthCookies(res, result);
    return apiSuccess("Token refreshed", this.authCookieService.sanitizeAuthResponse(result));
  }

  @ApiOperation({ summary: "Logout" })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "Logout successful — refresh token revoked" })
  @ApiResponse({ status: 401, description: "Unauthorized — invalid or missing JWT" })
  @ApiBearerAuth()
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @AllowAuthenticated()
  @AllowPendingPasswordChange()
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(logoutSchema.strict())) body: z.infer<typeof logoutSchema>,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = readRefreshTokenFromRequest(request.cookies ?? {}, body) ?? undefined;
    const result = await this.authService.logout(user, { refreshToken }, getRequestMeta(request));
    this.authCookieService.clearAuthCookies(res);
    return apiSuccess("Logout successful", result);
  }

  @ApiOperation({ summary: "Logout All Devices" })
  @ApiResponse({ status: 200, description: "Logged out from all devices — all refresh tokens revoked" })
  @ApiResponse({ status: 401, description: "Unauthorized — invalid or missing JWT" })
  @ApiBearerAuth()
  @Post("logout-all")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("auth.logout-all")
  async logoutAll(@CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logoutAll(user, getRequestMeta(request));
    this.authCookieService.clearAuthCookies(res);
    return apiSuccess("Logged out from all devices", result);
  }

  @ApiOperation({ summary: "Change Password" })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized — invalid current password or missing JWT" })
  @ApiBearerAuth()
  @Post("change-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("auth.change-password")
  @AllowPendingPasswordChange()
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema.strict())) body: z.infer<typeof changePasswordSchema>,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(user, body, getRequestMeta(request));
    this.authCookieService.clearAuthCookies(res);
    return apiSuccess("Password changed successfully", result);
  }

  @ApiOperation({ summary: "Get Login History" })
  @ApiResponse({ status: 200, description: "Login history retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized — invalid or missing JWT" })
  @ApiBearerAuth()
  @Get("login-history")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("auth.login-history")
  async getLoginHistory(@CurrentUser() user: AuthenticatedUser, @Query() query: unknown) {
    return apiSuccess("Login history retrieved", await this.authService.getLoginHistory(user, query));
  }

  @ApiOperation({ summary: "Get Current User" })
  @ApiResponse({ status: 200, description: "Authenticated user profile retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized — invalid or missing JWT" })
  @ApiBearerAuth()
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @AllowAuthenticated()
  @AllowPendingPasswordChange()
  async me(@CurrentUser() user: AuthenticatedUser) {
    return apiSuccess("Authenticated user retrieved", await this.authService.me(user));
  }
}
