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
import {
  closeCounselingCaseSchema,
  createCounselingCaseSchema,
  createCounselingNoteSchema,
  updateCounselingCaseSchema,
} from "./counseling.dto";
import { CounselingService } from "./counseling.service";

@Controller("counseling")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Counseling")
@ApiBearerAuth()
export class CounselingController {
  constructor(@Inject(CounselingService) private readonly service: CounselingService) {}

  @ApiOperation({ summary: "List Cases" })
  @ApiResponse({ status: 200, description: "Counseling list cases" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("cases")
  @RequirePermissions("counseling.view")
  async listCases(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Counseling cases retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create Case" })
  @ApiResponse({ status: 200, description: "Counseling create case" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("cases")
  @RequirePermissions("counseling.create")
  async createCase(
    @Body(new ZodValidationPipe(createCounselingCaseSchema.strict())) body: z.infer<typeof createCounselingCaseSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Counseling case created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Get Case" })
  @ApiResponse({ status: 200, description: "Counseling get case" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("cases/:id")
  @RequirePermissions("counseling.view")
  async getCase(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Counseling case retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Update Case" })
  @ApiResponse({ status: 200, description: "Counseling update case" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("cases/:id")
  @RequirePermissions("counseling.update")
  async updateCase(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateCounselingCaseSchema.strict())) body: z.infer<typeof updateCounselingCaseSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Counseling case updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete Case" })
  @ApiResponse({ status: 200, description: "Counseling delete case" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("cases/:id")
  @RequirePermissions("counseling.delete")
  async deleteCase(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Counseling case deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Close Case" })
  @ApiResponse({ status: 200, description: "Counseling close case" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("cases/:id/close")
  @RequirePermissions("counseling.update")
  async closeCase(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(closeCounselingCaseSchema.strict())) body: z.infer<typeof closeCounselingCaseSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Counseling case closed", await this.service.close(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reopen Case" })
  @ApiResponse({ status: 200, description: "Counseling reopen case" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("cases/:id/reopen")
  @RequirePermissions("counseling.update")
  async reopenCase(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Counseling case reopened", await this.service.reopen(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "List Notes" })
  @ApiResponse({ status: 200, description: "Counseling list notes" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("cases/:id/notes")
  @RequirePermissions("counseling.view")
  async listNotes(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Counseling notes retrieved", await this.service.listNotes(id));
  }

  @ApiOperation({ summary: "Create Note" })
  @ApiResponse({ status: 200, description: "Counseling create note" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("cases/:id/notes")
  @RequirePermissions("counseling.update")
  async createNote(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(createCounselingNoteSchema.strict())) body: z.infer<typeof createCounselingNoteSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Counseling note created", await this.service.createNote(id, body, user, getRequestMeta(request)));
  }
}
