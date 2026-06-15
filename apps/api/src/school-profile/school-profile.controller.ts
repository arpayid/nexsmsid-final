import { Body, Controller, Get, Inject, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { updateSchoolProfileSchema } from "./school-profile.dto";
import { SchoolProfileService } from "./school-profile.service";

@Controller("school-profile")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("School Profile")
@ApiBearerAuth()
export class SchoolProfileController {
  constructor(@Inject(SchoolProfileService) private readonly schoolProfileService: SchoolProfileService) {}

  @ApiOperation({ summary: "Get" })
  @ApiResponse({ status: 200, description: "School Profile get" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("school-profile.view")
  async get() {
    return apiSuccess("School profile retrieved", await this.schoolProfileService.get());
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "School Profile update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch()
  @RequirePermissions("school-profile.update")
  async update(
    @Body(new ZodValidationPipe(updateSchoolProfileSchema.strict())) body: z.infer<typeof updateSchoolProfileSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("School profile updated", await this.schoolProfileService.update(body, user, getRequestMeta(request)));
  }
}
