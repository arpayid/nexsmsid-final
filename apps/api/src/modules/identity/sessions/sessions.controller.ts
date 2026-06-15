import { Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../../../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { AuthenticatedUser, RequestWithUser, getRequestMeta } from "../../../auth/auth.types";
import { AllowAuthenticated } from "../../../auth/decorators/allow-authenticated.decorator";
import { CurrentUser } from "../../../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { apiSuccess } from "../../../common/api-response";
import { SessionsService } from "./sessions.service";

@Controller("auth/sessions")
@UseGuards(JwtAuthGuard)
@AllowAuthenticated()
@ApiTags("Sessions")
@ApiBearerAuth()
export class SessionsController {
  constructor(@Inject(SessionsService) private readonly sessionsService: SessionsService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Sessions list" })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: { page?: string; limit?: string }) {
    return apiSuccess("Sessions retrieved", await this.sessionsService.list(user.id, query));
  }

  @ApiOperation({ summary: "Revoke" })
  @ApiResponse({ status: 200, description: "Sessions revoke" })
  @Delete(":id")
  async revoke(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.sessionsService.revoke(id, user.id);

    if (!result) {
      return apiSuccess("Session not found or already revoked", null);
    }

    return apiSuccess("Session revoked", result);
  }

  @ApiOperation({ summary: "Revoke All" })
  @ApiResponse({ status: 200, description: "Sessions revoke all" })
  @Post("revoke-all")
  async revokeAll(@CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("All sessions revoked", await this.sessionsService.revokeAll(user.id));
  }
}
