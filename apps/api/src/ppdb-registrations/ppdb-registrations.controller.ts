import { Body, Controller, Get, Header, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";
import type { Response } from "express";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { PrintDocumentService } from "../pdf/print-document.service";
import { convertPpdbRegistrationSchema } from "../portal-provisioning/portal-provisioning.dto";
import {
  adminCreatePpdbRegistrationSchema,
  createPpdbDocumentSchema,
  ppdbActionNoteSchema,
  updatePpdbRegistrationSchema,
} from "./ppdb-registrations.dto";
import { PpdbRegistrationsService } from "./ppdb-registrations.service";

@Controller("ppdb/registrations")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Ppdb Registrations")
@ApiBearerAuth()
export class PpdbRegistrationsController {
  constructor(
    @Inject(PpdbRegistrationsService) private readonly service: PpdbRegistrationsService,
    @Inject(PrintDocumentService) private readonly printService: PrintDocumentService,
  ) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("ppdb.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("PPDB registrations retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("ppdb.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("PPDB registration retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("ppdb.create")
  async create(
    @Body(new ZodValidationPipe(adminCreatePpdbRegistrationSchema.strict())) body: z.infer<typeof adminCreatePpdbRegistrationSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("PPDB registration created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("ppdb.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updatePpdbRegistrationSchema.strict())) body: z.infer<typeof updatePpdbRegistrationSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("PPDB registration updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Submit" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations submit" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/submit")
  @RequirePermissions("ppdb.create")
  async submit(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("PPDB registration submitted", await this.service.submit(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Verify" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations verify" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/verify")
  @RequirePermissions("ppdb.verify")
  async verify(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("PPDB registration verified", await this.service.verify(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Request Revision" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations request revision" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/request-revision")
  @RequirePermissions("ppdb.update")
  async requestRevision(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(ppdbActionNoteSchema.strict())) body: z.infer<typeof ppdbActionNoteSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("PPDB revision requested", await this.service.requestRevision(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Accept" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations accept" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/accept")
  @RequirePermissions("ppdb.approve")
  async accept(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(ppdbActionNoteSchema.strict())) body: z.infer<typeof ppdbActionNoteSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("PPDB registration accepted", await this.service.accept(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reject" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations reject" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/reject")
  @RequirePermissions("ppdb.reject")
  async reject(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(ppdbActionNoteSchema.strict())) body: z.infer<typeof ppdbActionNoteSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("PPDB registration rejected", await this.service.reject(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Convert To Student" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations convert to student" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/convert-to-student")
  @RequirePermissions("ppdb.convert")
  async convertToStudent(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(convertPpdbRegistrationSchema.strict())) body: z.infer<typeof convertPpdbRegistrationSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    const result = await this.service.convertToStudent(id, body, user, getRequestMeta(request));
    return apiSuccess("PPDB registration converted to student", result);
  }

  @ApiOperation({ summary: "List Documents" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations list documents" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/documents")
  @RequirePermissions("ppdb.view")
  async listDocuments(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Documents retrieved", await this.service.listDocuments(id));
  }

  @ApiOperation({ summary: "Create Document" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations create document" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/documents")
  @RequirePermissions("ppdb.create")
  async createDocument(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(createPpdbDocumentSchema.strict())) body: z.infer<typeof createPpdbDocumentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Document added", await this.service.createDocument(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Download Proof" })
  @ApiResponse({ status: 200, description: "Ppdb Registrations download proof" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/proof.pdf")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("ppdb.print")
  async downloadProof(
    @Param("id", ParseCuidPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const reg = await this.service.findById(id);
    const buffer = await this.printService.renderPpdbProof(id);
    await this.printService.logPrint("ppdb.proof.print", "ppdb_registration", id, user, getRequestMeta(request), {
      registrationNumber: reg.registrationNumber,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="ppdb-${reg.registrationNumber}.pdf"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.end(buffer);
  }
}
