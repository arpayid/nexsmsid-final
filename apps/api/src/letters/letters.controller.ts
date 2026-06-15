import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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
import { ppdbDocumentFileInterceptorOptions } from "../common/upload";
import {
  createLetterSchema,
  createLetterTemplateSchema,
  rejectLetterSchema,
  updateLetterSchema,
  updateLetterTemplateSchema,
} from "./letters.dto";
import { LettersService } from "./letters.service";

@Controller("letters")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Letters")
@ApiBearerAuth()
export class LettersController {
  constructor(@Inject(LettersService) private readonly service: LettersService) {}

  @ApiOperation({ summary: "List Templates" })
  @ApiResponse({ status: 200, description: "Letters list templates" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("templates")
  @RequirePermissions("letters.view")
  async listTemplates(@Query() query: unknown) {
    const result = await this.service.listTemplates(query);
    return apiSuccess("Letter templates retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create Template" })
  @ApiResponse({ status: 200, description: "Letters create template" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("templates")
  @RequirePermissions("letters.manage-templates")
  async createTemplate(
    @Body(new ZodValidationPipe(createLetterTemplateSchema.strict())) body: z.infer<typeof createLetterTemplateSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Letter template created", await this.service.createTemplate(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Get Template" })
  @ApiResponse({ status: 200, description: "Letters get template" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("templates/:id")
  @RequirePermissions("letters.view")
  async getTemplate(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Letter template retrieved", await this.service.getTemplate(id));
  }

  @ApiOperation({ summary: "Update Template" })
  @ApiResponse({ status: 200, description: "Letters update template" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("templates/:id")
  @RequirePermissions("letters.manage-templates")
  async updateTemplate(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateLetterTemplateSchema.strict())) body: z.infer<typeof updateLetterTemplateSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Letter template updated", await this.service.updateTemplate(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete Template" })
  @ApiResponse({ status: 200, description: "Letters delete template" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("templates/:id")
  @RequirePermissions("letters.manage-templates")
  async deleteTemplate(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter template deleted", await this.service.deleteTemplate(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Summary" })
  @ApiResponse({ status: 200, description: "Letters summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("letters.report")
  async summary() {
    return apiSuccess("Letter summary retrieved", await this.service.summary());
  }

  @ApiOperation({ summary: "Number Preview" })
  @ApiResponse({ status: 200, description: "Letters number preview" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("number-preview")
  @RequirePermissions("letters.view")
  async numberPreview(@Query() query: unknown) {
    return apiSuccess("Letter number preview retrieved", await this.service.numberPreview(query));
  }

  @ApiOperation({ summary: "List Letters" })
  @ApiResponse({ status: 200, description: "Letters list letters" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("letters.view")
  async listLetters(@Query() query: unknown) {
    const result = await this.service.listLetters(query);
    return apiSuccess("Letters retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create Letter" })
  @ApiResponse({ status: 200, description: "Letters create letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("letters.create")
  async createLetter(
    @Body(new ZodValidationPipe(createLetterSchema.strict())) body: z.infer<typeof createLetterSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Letter created", await this.service.createLetter(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Get Letter" })
  @ApiResponse({ status: 200, description: "Letters get letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("letters.view")
  async getLetter(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Letter retrieved", await this.service.getLetter(id));
  }

  @ApiOperation({ summary: "Upload Letter Attachment" })
  @ApiResponse({ status: 200, description: "Letter attachment uploaded" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/attachments")
  @RequirePermissions("letters.update")
  @UseInterceptors(FileInterceptor("file", ppdbDocumentFileInterceptorOptions))
  async uploadAttachment(
    @Param("id", ParseCuidPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Letter attachment uploaded", await this.service.uploadAttachment(id, file, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Download Letter Attachment" })
  @ApiResponse({ status: 200, description: "Letter attachment file stream" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/attachments/:attachmentId/file")
  @RequirePermissions("letters.view")
  async downloadAttachment(
    @Param("id", ParseCuidPipe) id: string,
    @Param("attachmentId", ParseCuidPipe) attachmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    await this.service.streamAttachment(id, attachmentId, user, getRequestMeta(request), res);
  }

  @ApiOperation({ summary: "Update Letter" })
  @ApiResponse({ status: 200, description: "Letters update letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("letters.update")
  async updateLetter(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateLetterSchema.strict())) body: z.infer<typeof updateLetterSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Letter updated", await this.service.updateLetter(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete Letter" })
  @ApiResponse({ status: 200, description: "Letters delete letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("letters.delete")
  async deleteLetter(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter deleted", await this.service.deleteLetter(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Submit Letter" })
  @ApiResponse({ status: 200, description: "Letters submit letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/submit")
  @RequirePermissions("letters.update")
  async submitLetter(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter submitted", await this.service.submitLetter(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Approve Letter" })
  @ApiResponse({ status: 200, description: "Letters approve letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/approve")
  @RequirePermissions("letters.approve")
  async approveLetter(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter approved", await this.service.approveLetter(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reject Letter" })
  @ApiResponse({ status: 200, description: "Letters reject letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/reject")
  @RequirePermissions("letters.reject")
  async rejectLetter(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(rejectLetterSchema.strict())) body: z.infer<typeof rejectLetterSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Letter rejected", await this.service.rejectLetter(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Issue Letter" })
  @ApiResponse({ status: 200, description: "Letters issue letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/issue")
  @RequirePermissions("letters.issue")
  async issueLetter(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter issued", await this.service.issueLetter(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Archive Letter" })
  @ApiResponse({ status: 200, description: "Letters archive letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/archive")
  @RequirePermissions("letters.archive")
  async archiveLetter(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter archived", await this.service.archiveLetter(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Cancel Letter" })
  @ApiResponse({ status: 200, description: "Letters cancel letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/cancel")
  @RequirePermissions("letters.update")
  async cancelLetter(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter cancelled", await this.service.cancelLetter(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Reopen Letter" })
  @ApiResponse({ status: 200, description: "Letters reopen letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/reopen")
  @RequirePermissions("letters.update")
  async reopenLetter(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter reopened", await this.service.reopenLetter(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Generate Number" })
  @ApiResponse({ status: 200, description: "Letters generate number" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/generate-number")
  @RequirePermissions("letters.issue")
  async generateNumber(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Letter number generated", await this.service.generateNumber(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Print Letter" })
  @ApiResponse({ status: 200, description: "Letters print letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/print")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("letters.print")
  async printLetter(
    @Param("id", ParseCuidPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const result = await this.service.printLetter(id, user, getRequestMeta(request));
    this.sendPdf(res, result.buffer, result.filename);
  }

  @ApiOperation({ summary: "Pdf Letter" })
  @ApiResponse({ status: 200, description: "Letters pdf letter" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/pdf")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("letters.print")
  async pdfLetter(
    @Param("id", ParseCuidPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const result = await this.service.printLetter(id, user, getRequestMeta(request));
    this.sendPdf(res, result.buffer, result.filename);
  }

  private sendPdf(res: Response, buffer: Buffer, filename: string) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.end(buffer);
  }
}
