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
import { createStaffSchema, importBodySchema, updateStaffSchema } from "./staffs.dto";
import { getStaffsImportConfig } from "./staffs.excel";
import { StaffsService } from "./staffs.service";

@Controller("staffs")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Staffs")
@ApiBearerAuth()
export class StaffsController {
  constructor(
    @Inject(StaffsService) private readonly staffsService: StaffsService,
    @Inject(ExcelImportService) private readonly excelImportService: ExcelImportService,
  ) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Staffs list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("staffs.view")
  async list(@Query() query: unknown) {
    const result = await this.staffsService.list(query);
    return apiSuccess("Staffs retrieved", result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  }

  @ApiOperation({ summary: "Template" })
  @ApiResponse({ status: 200, description: "Staffs template" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("template")
  @RequirePermissions("staffs.import")
  async template(@Res() response: Response) {
    const buffer = await this.excelImportService.buildTemplate(getStaffsImportConfig(this.staffsService));
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="staffs-template.xlsx"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }

  @ApiOperation({ summary: "Export" })
  @ApiResponse({ status: 200, description: "Staffs export" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("export")
  @RequirePermissions("staffs.export")
  async export(@Res() response: Response) {
    const records = await this.staffsService.exportAll();
    const buffer = await this.excelImportService.exportRows(getStaffsImportConfig(this.staffsService), records);
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="staffs-export.xlsx"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }

  @ApiOperation({ summary: "Import" })
  @ApiResponse({ status: 200, description: "Staffs import" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("import")
  @RequirePermissions("staffs.import")
  @UseInterceptors(FileInterceptor("file", excelFileInterceptorOptions))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Body(new ZodValidationPipe(importBodySchema)) _body: z.infer<typeof importBodySchema>,
  ) {
    if (!file) {
      return apiSuccess("Staff import failed", {
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [{ row: 0, message: "No file uploaded" }],
      });
    }
    const result = await this.excelImportService.importFromBuffer(
      getStaffsImportConfig(this.staffsService),
      file.buffer,
      user,
      getRequestMeta(request),
      file.originalname,
    );
    return apiSuccess("Staff import completed", result);
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Staffs find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("staffs.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Staff retrieved", await this.staffsService.findById(id));
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Staffs create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("staffs.create")
  async create(
    @Body(new ZodValidationPipe(createStaffSchema.strict())) body: z.infer<typeof createStaffSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Staff created", await this.staffsService.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Staffs update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("staffs.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateStaffSchema.strict())) body: z.infer<typeof updateStaffSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Staff updated", await this.staffsService.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Staffs delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("staffs.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Staff deleted", await this.staffsService.delete(id, user, getRequestMeta(request)));
  }
}
