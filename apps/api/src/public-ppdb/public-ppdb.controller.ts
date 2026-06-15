import { Body, Controller, Get, Inject, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from "@nestjs/swagger";
import type { Response } from "express";

import { z } from "zod";

import { CaptchaService } from "../common/captcha/captcha.service";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { apiSuccess } from "../common/api-response";
import { ppdbDocumentFileInterceptorOptions } from "../common/upload";
import { Public } from "../auth/decorators/public.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { publicPpdbRegisterSchema, publicPpdbSubmitDocumentSchema, publicPpdbUploadBodySchema } from "./public-ppdb.dto";
import { PublicPpdbService } from "./public-ppdb.service";

@Controller("public/ppdb")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Public()
@ApiTags("Public Ppdb")
@ApiBearerAuth()
export class PublicPpdbController {
  constructor(
    @Inject(PublicPpdbService) private readonly service: PublicPpdbService,
    @Inject(CaptchaService) private readonly captchaService: CaptchaService,
  ) {}

  @ApiOperation({ summary: "Get Active Period" })
  @ApiResponse({ status: 200, description: "Public Ppdb get active period" })
  @Get("active-period")
  async getActivePeriod() {
    return apiSuccess("Active PPDB period retrieved", await this.service.getActivePeriod());
  }

  @ApiOperation({ summary: "Register" })
  @ApiResponse({ status: 200, description: "Public Ppdb register" })
  @ApiResponse({ status: 429, description: "Too many requests — rate limited" })
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body(new ZodValidationPipe(publicPpdbRegisterSchema.strict())) body: z.infer<typeof publicPpdbRegisterSchema>) {
    await this.captchaService.verify(body.captchaToken);
    const { captchaToken: _captcha, ...payload } = body;
    return apiSuccess("PPDB registration submitted", await this.service.register(payload));
  }

  @ApiOperation({ summary: "Upload PPDB document file" })
  @ApiConsumes("multipart/form-data")
  @Post("upload")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor("file", ppdbDocumentFileInterceptorOptions))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(publicPpdbUploadBodySchema.strict())) body: z.infer<typeof publicPpdbUploadBodySchema>,
  ) {
    await this.captchaService.verify(body.captchaToken);
    return apiSuccess("File uploaded", await this.service.saveUploadedDocument(file, body.uploadToken));
  }

  @ApiOperation({ summary: "Submit PPDB document metadata" })
  @Post("documents")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async submitDocument(
    @Body(new ZodValidationPipe(publicPpdbSubmitDocumentSchema.strict())) body: z.infer<typeof publicPpdbSubmitDocumentSchema>,
  ) {
    await this.captchaService.verify(body.captchaToken);
    const { captchaToken: _captcha, ...payload } = body;
    return apiSuccess("Document submitted", await this.service.submitDocument(payload));
  }

  @ApiOperation({ summary: "Download PPDB document file (requires upload token)" })
  @Get("documents/:documentId/file")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async downloadDocument(
    @Param("documentId", ParseCuidPipe) documentId: string,
    @Query("uploadToken") uploadToken: string,
    @Res() response: Response,
  ) {
    await this.service.streamDocumentFile(documentId, uploadToken, response);
  }
}
