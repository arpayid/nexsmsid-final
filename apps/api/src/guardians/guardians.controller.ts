import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import {
  Body,
  Controller,
  Delete,
  Get,
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

import { excelFileInterceptorOptions } from "../common/upload";
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
import { ExcelImportService } from "../excel/excel-import.service";
import { createGuardianSchema, importBodySchema, updateGuardianSchema } from "./guardians.dto";
import { getGuardiansImportConfig } from "./guardians.excel";
import { GuardiansService } from "./guardians.service";

@Controller("guardians")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Guardians")
@ApiBearerAuth()
export class GuardiansController {
  constructor(
    @Inject(GuardiansService) private readonly guardiansService: GuardiansService,
    @Inject(ExcelImportService) private readonly excelImportService: ExcelImportService,
  ) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Guardians list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("guardians.view")
  async list(@Query() query: unknown) {
    const result = await this.guardiansService.list(query);
    return apiSuccess("Guardians retrieved", result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  }

  @ApiOperation({ summary: "Template" })
  @ApiResponse({ status: 200, description: "Guardians template" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("template")
  @RequirePermissions("guardians.import")
  async template(@Res() response: Response) {
    const buffer = await this.excelImportService.buildTemplate(getGuardiansImportConfig(this.guardiansService));
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="guardians-template.xlsx"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }

  @ApiOperation({ summary: "Export" })
  @ApiResponse({ status: 200, description: "Guardians export" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("export")
  @RequirePermissions("guardians.export")
  async export(@Res() response: Response) {
    const records = await this.guardiansService.exportAll();
    const buffer = await this.excelImportService.exportRows(getGuardiansImportConfig(this.guardiansService), records);
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="guardians-export.xlsx"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }

  @ApiOperation({ summary: "Import" })
  @ApiResponse({ status: 200, description: "Guardians import" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("import")
  @RequirePermissions("guardians.import")
  @UseInterceptors(FileInterceptor("file", excelFileInterceptorOptions))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Body(new ZodValidationPipe(importBodySchema)) _body: z.infer<typeof importBodySchema>,
  ) {
    if (!file) {
      return apiSuccess("Guardian import failed", {
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [{ row: 0, message: "No file uploaded" }],
      });
    }
    const result = await this.excelImportService.importFromBuffer(
      getGuardiansImportConfig(this.guardiansService),
      file.buffer,
      user,
      getRequestMeta(request),
      file.originalname,
    );
    return apiSuccess("Guardian import completed", result);
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Guardians find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("guardians.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Guardian retrieved", await this.guardiansService.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Guardians create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("guardians.create")
  async create(
    @Body(new ZodValidationPipe(createGuardianSchema.strict())) body: z.infer<typeof createGuardianSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Guardian created", await this.guardiansService.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Guardians update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("guardians.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateGuardianSchema.strict())) body: z.infer<typeof updateGuardianSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Guardian updated", await this.guardiansService.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Guardians delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("guardians.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Guardian deleted", await this.guardiansService.delete(id, user, getRequestMeta(request)));
  }
}
