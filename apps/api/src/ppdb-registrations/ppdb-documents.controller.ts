import { Body, Controller, Get, Inject, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";

import { z } from "zod";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { ppdbActionNoteSchema, updatePpdbDocumentSchema } from "./ppdb-registrations.dto";
import { PpdbRegistrationsService } from "./ppdb-registrations.service";

@Controller("ppdb/documents")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Ppdb Documents")
@ApiBearerAuth()
export class PpdbDocumentsController {
  constructor(@Inject(PpdbRegistrationsService) private readonly service: PpdbRegistrationsService) {}

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Ppdb Documents find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("ppdb.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Document retrieved", await this.service.listDocuments(id));
  }

  @ApiOperation({ summary: "Download document file" })
  @ApiResponse({ status: 200, description: "Ppdb document file stream" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":documentId/file")
  @RequirePermissions("ppdb.view")
  async downloadFile(@Param("documentId", ParseCuidPipe) documentId: string, @Res() response: Response) {
    await this.service.streamDocumentById(documentId, response);
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Ppdb Documents update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":documentId")
  @RequirePermissions("ppdb.update")
  async update(
    @Param("documentId", ParseCuidPipe) documentId: string,
    @Body(new ZodValidationPipe(updatePpdbDocumentSchema.strict())) body: z.infer<typeof updatePpdbDocumentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Document updated", await this.service.updateDocument(documentId, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Verify" })
  @ApiResponse({ status: 200, description: "Ppdb Documents verify" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":documentId/verify")
  @RequirePermissions("ppdb.verify")
  async verify(
    @Param("documentId", ParseCuidPipe) documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Document verified", await this.service.verifyDocument(documentId, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reject" })
  @ApiResponse({ status: 200, description: "Ppdb Documents reject" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":documentId/reject")
  @RequirePermissions("ppdb.reject")
  async reject(
    @Param("documentId", ParseCuidPipe) documentId: string,
    @Body(new ZodValidationPipe(ppdbActionNoteSchema.strict())) body: z.infer<typeof ppdbActionNoteSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Document rejected", await this.service.rejectDocument(documentId, body, user, getRequestMeta(request)));
  }
}
