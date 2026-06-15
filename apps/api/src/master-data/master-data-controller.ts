import { Body, Delete, Get, Param, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { excelFileInterceptorOptions } from "../common/upload";
import type { Response } from "express";

import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ResourceImportConfig, ExcelImportService } from "../excel/excel-import.service";
import { BaseMasterDataService } from "./base-master-data.service";

export type MasterDataExcelOptions = {
  excelImportService: ExcelImportService;
  resourceKey: string;
  getImportConfig: () => ResourceImportConfig;
  performExport: () => Promise<Record<string, unknown>[]>;
};

@UseGuards(JwtAuthGuard, PermissionGuard)
export abstract class MasterDataController {
  protected constructor(
    private readonly resourceLabel: string,
    private readonly service: BaseMasterDataService<any, any>,
    private readonly excelOptions?: MasterDataExcelOptions,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("master-data.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess(`${this.resourceLabel} retrieved`, result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get("template")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("master-data.import")
  async template(@Res() response: Response) {
    if (!this.excelOptions) {
      return apiSuccess("Template not available", null);
    }
    const buffer = await this.excelOptions.excelImportService.buildTemplate(this.excelOptions.getImportConfig());
    this.sendExcel(response, buffer, `${this.excelOptions.resourceKey}-template.xlsx`);
  }

  @Get("export")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("master-data.export")
  async export(@Res() response: Response) {
    if (!this.excelOptions) {
      return apiSuccess("Export not available", null);
    }
    const records = await this.excelOptions.performExport();
    const buffer = await this.excelOptions.excelImportService.exportRows(this.excelOptions.getImportConfig(), records);
    this.sendExcel(response, buffer, `${this.excelOptions.resourceKey}-export.xlsx`);
  }

  @Post("import")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("master-data.import")
  @UseInterceptors(FileInterceptor("file", excelFileInterceptorOptions))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Body() _body: unknown,
  ) {
    if (!this.excelOptions) {
      return apiSuccess("Import not available", null);
    }
    if (!file) {
      return apiSuccess(`${this.resourceLabel} import failed`, {
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [{ row: 0, message: "No file uploaded" }],
      });
    }
    const result = await this.excelOptions.excelImportService.importFromBuffer(
      this.excelOptions.getImportConfig(),
      file.buffer,
      user,
      getRequestMeta(request),
      file.originalname,
    );
    return apiSuccess(`${this.resourceLabel} import completed`, result);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("master-data.view")
  async findById(@Param("id") id: string) {
    return apiSuccess(`${this.resourceLabel} retrieved`, await this.service.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("master-data.create")
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess(`${this.resourceLabel} created`, await this.service.create(body, user, getRequestMeta(request)));
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("master-data.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess(`${this.resourceLabel} updated`, await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("master-data.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess(`${this.resourceLabel} deleted`, await this.service.delete(id, user, getRequestMeta(request)));
  }

  private sendExcel(response: Response, buffer: Buffer, filename: string) {
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }
}
