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
import { Throttle } from "@nestjs/throttler";

import { excelFileInterceptorOptions } from "../common/upload";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiResponse } from "@nestjs/swagger";

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
import {
  createStudentSchema,
  importBodySchema,
  linkStudentGuardianSchema,
  updateStudentGuardianSchema,
  updateStudentSchema,
} from "./students.dto";
import { provisionStudentPortalSchema } from "../portal-provisioning/portal-provisioning.dto";
import { getStudentsImportConfig } from "./students.excel";
import { StudentsService } from "./students.service";

@Controller("students")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Students")
@ApiBearerAuth()
export class StudentsController {
  constructor(
    @Inject(StudentsService) private readonly studentsService: StudentsService,
    @Inject(ExcelImportService) private readonly excelImportService: ExcelImportService,
  ) {}

  @ApiOperation({ summary: "List Students" })
  @ApiResponse({ status: 200, description: "Paginated list of students retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("students.view")
  async list(@Query() query: unknown) {
    const result = await this.studentsService.list(query);
    return apiSuccess("Students retrieved", result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  }

  @ApiOperation({ summary: "Download Import Template" })
  @ApiResponse({ status: 200, description: "Excel import template downloaded" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("template")
  @RequirePermissions("students.import")
  async template(@Res() response: Response) {
    const buffer = await this.excelImportService.buildTemplate(getStudentsImportConfig(this.studentsService));
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="students-template.xlsx"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }

  @ApiOperation({ summary: "Export Students to Excel" })
  @ApiResponse({ status: 200, description: "Excel export file downloaded" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("export")
  @RequirePermissions("students.export")
  async export(@Res() response: Response) {
    const records = await this.studentsService.exportAll();
    const buffer = await this.excelImportService.exportRows(getStudentsImportConfig(this.studentsService), records);
    response
      .status(200)
      .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .setHeader("Content-Disposition", `attachment; filename="students-export.xlsx"`)
      .setHeader("Content-Length", String(buffer.length))
      .end(buffer);
  }

  @ApiOperation({ summary: "Import Students from Excel" })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "Student import completed with success/failure counts" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("import")
  @RequirePermissions("students.import")
  @UseInterceptors(FileInterceptor("file", excelFileInterceptorOptions))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Body(new ZodValidationPipe(importBodySchema)) _body: z.infer<typeof importBodySchema>,
  ) {
    if (!file) {
      return apiSuccess("Student import failed", {
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [{ row: 0, message: "No file uploaded" }],
      });
    }
    const result = await this.excelImportService.importFromBuffer(
      getStudentsImportConfig(this.studentsService),
      file.buffer,
      user,
      getRequestMeta(request),
      file.originalname,
    );
    return apiSuccess("Student import completed", result);
  }

  @ApiOperation({ summary: "Find Student By ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Student retrieved by ID" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Student not found" })
  @Get(":studentId/guardians")
  @RequirePermissions("students.view")
  async listGuardians(@Param("studentId", ParseCuidPipe) studentId: string) {
    return apiSuccess("Student guardians retrieved", await this.studentsService.listGuardians(studentId));
  }

  @ApiOperation({ summary: "Link guardian to student" })
  @Post(":studentId/guardians")
  @RequirePermissions("students.update")
  async linkGuardian(
    @Param("studentId", ParseCuidPipe) studentId: string,
    @Body(new ZodValidationPipe(linkStudentGuardianSchema.strict())) body: z.infer<typeof linkStudentGuardianSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Guardian linked", await this.studentsService.linkGuardian(studentId, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update student-guardian link" })
  @Patch(":studentId/guardians/:guardianId")
  @RequirePermissions("students.update")
  async updateGuardianLink(
    @Param("studentId", ParseCuidPipe) studentId: string,
    @Param("guardianId", ParseCuidPipe) guardianId: string,
    @Body(new ZodValidationPipe(updateStudentGuardianSchema.strict())) body: z.infer<typeof updateStudentGuardianSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess(
      "Guardian link updated",
      await this.studentsService.updateGuardianLink(studentId, guardianId, body, user, getRequestMeta(request)),
    );
  }

  @ApiOperation({ summary: "Unlink guardian from student" })
  @Delete(":studentId/guardians/:guardianId")
  @RequirePermissions("students.update")
  async unlinkGuardian(
    @Param("studentId", ParseCuidPipe) studentId: string,
    @Param("guardianId", ParseCuidPipe) guardianId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Guardian unlinked", await this.studentsService.unlinkGuardian(studentId, guardianId, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find Student By ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Student retrieved by ID" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Student not found" })
  @Get(":id")
  @RequirePermissions("students.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Student retrieved", await this.studentsService.findById(id));
  }

  @ApiOperation({ summary: "Create Student" })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "Student created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("students.create")
  async create(
    @Body(new ZodValidationPipe(createStudentSchema.strict())) body: z.infer<typeof createStudentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Student created", await this.studentsService.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update Student" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "Student updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Student not found" })
  @Patch(":id")
  @RequirePermissions("students.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateStudentSchema.strict())) body: z.infer<typeof updateStudentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Student updated", await this.studentsService.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete Student" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Student soft-deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Student not found" })
  @Delete(":id")
  @RequirePermissions("students.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Student deleted", await this.studentsService.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Provision student portal account" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Student portal account provisioned" })
  @Post(":id/provision-portal")
  @RequirePermissions("students.provision-portal")
  async provisionPortal(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(provisionStudentPortalSchema.strict())) body: z.infer<typeof provisionStudentPortalSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess(
      "Student portal account provisioned",
      await this.studentsService.provisionPortalAccount(id, body, user, getRequestMeta(request)),
    );
  }

  @ApiOperation({ summary: "Reset student portal password" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Student portal password reset" })
  @Post(":id/reset-portal-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @RequirePermissions("students.provision-portal")
  async resetPortalPassword(
    @Param("id", ParseCuidPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Student portal password reset", await this.studentsService.resetPortalPassword(id, user, getRequestMeta(request)));
  }
}
