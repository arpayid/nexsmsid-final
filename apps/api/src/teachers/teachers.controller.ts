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
import { createTeacherSchema, importBodySchema, updateTeacherSchema } from "./teachers.dto";
import { getTeachersImportConfig } from "./teachers.excel";
import { TeachersService } from "./teachers.service";

@Controller("teachers")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Teachers")
@ApiBearerAuth()
export class TeachersController {
  constructor(
    @Inject(TeachersService) private readonly teachersService: TeachersService,
    @Inject(ExcelImportService) private readonly excelImportService: ExcelImportService,
  ) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Teachers list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("teachers.view")
  async list(@Query() query: unknown) {
    const result = await this.teachersService.list(query);
    return apiSuccess("Teachers retrieved", result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  }

  @ApiOperation({ summary: "Template" })
  @ApiResponse({ status: 200, description: "Teachers template" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("template")
  @RequirePermissions("teachers.import")
  async template(@Res() response: Response) {
    const buffer = await this.excelImportService.buildTemplate(getTeachersImportConfig(this.teachersService));
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="teachers-template.xlsx"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }

  @ApiOperation({ summary: "Export" })
  @ApiResponse({ status: 200, description: "Teachers export" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("export")
  @RequirePermissions("teachers.export")
  async export(@Res() response: Response) {
    const records = await this.teachersService.exportAll();
    const buffer = await this.excelImportService.exportRows(getTeachersImportConfig(this.teachersService), records);
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="teachers-export.xlsx"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }

  @ApiOperation({ summary: "Import" })
  @ApiResponse({ status: 200, description: "Teachers import" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("import")
  @RequirePermissions("teachers.import")
  @UseInterceptors(FileInterceptor("file", excelFileInterceptorOptions))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Body(new ZodValidationPipe(importBodySchema)) _body: z.infer<typeof importBodySchema>,
  ) {
    if (!file) {
      return apiSuccess("Teacher import failed", {
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [{ row: 0, message: "No file uploaded" }],
      });
    }
    const result = await this.excelImportService.importFromBuffer(
      getTeachersImportConfig(this.teachersService),
      file.buffer,
      user,
      getRequestMeta(request),
      file.originalname,
    );
    return apiSuccess("Teacher import completed", result);
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Teachers find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("teachers.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Teacher retrieved", await this.teachersService.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Teachers create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("teachers.create")
  async create(
    @Body(new ZodValidationPipe(createTeacherSchema.strict())) body: z.infer<typeof createTeacherSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Teacher created", await this.teachersService.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Teachers update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("teachers.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateTeacherSchema.strict())) body: z.infer<typeof updateTeacherSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Teacher updated", await this.teachersService.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Teachers delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("teachers.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Teacher deleted", await this.teachersService.delete(id, user, getRequestMeta(request)));
  }
}
