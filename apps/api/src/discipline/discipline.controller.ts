import { Body, Controller, Delete, Get, Header, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
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
import {
  createAchievementSchema,
  createDisciplineRuleSchema,
  createViolationSchema,
  updateAchievementSchema,
  updateDisciplineRuleSchema,
  updateViolationSchema,
} from "./discipline.dto";
import { DisciplineService } from "./discipline.service";

@Controller("discipline")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Discipline")
@ApiBearerAuth()
export class DisciplineController {
  constructor(@Inject(DisciplineService) private readonly service: DisciplineService) {}

  @ApiOperation({ summary: "List Rules" })
  @ApiResponse({ status: 200, description: "Discipline list rules" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("rules")
  @RequirePermissions("discipline.view")
  async listRules(@Query() query: unknown) {
    const result = await this.service.listRules(query);
    return apiSuccess("Discipline rules retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create Rule" })
  @ApiResponse({ status: 200, description: "Discipline create rule" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("rules")
  @RequirePermissions("discipline.create")
  async createRule(
    @Body(new ZodValidationPipe(createDisciplineRuleSchema.strict())) body: z.infer<typeof createDisciplineRuleSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Discipline rule created", await this.service.createRule(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Get Rule" })
  @ApiResponse({ status: 200, description: "Discipline get rule" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("rules/:id")
  @RequirePermissions("discipline.view")
  async getRule(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Discipline rule retrieved", await this.service.getRule(id));
  }

  @ApiOperation({ summary: "Update Rule" })
  @ApiResponse({ status: 200, description: "Discipline update rule" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("rules/:id")
  @RequirePermissions("discipline.update")
  async updateRule(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateDisciplineRuleSchema.strict())) body: z.infer<typeof updateDisciplineRuleSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Discipline rule updated", await this.service.updateRule(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete Rule" })
  @ApiResponse({ status: 200, description: "Discipline delete rule" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("rules/:id")
  @RequirePermissions("discipline.delete")
  async deleteRule(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Discipline rule deleted", await this.service.deleteRule(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "List Violations" })
  @ApiResponse({ status: 200, description: "Discipline list violations" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("violations")
  @RequirePermissions("discipline.view")
  async listViolations(@Query() query: unknown) {
    const result = await this.service.listViolations(query);
    return apiSuccess("Discipline violations retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create Violation" })
  @ApiResponse({ status: 200, description: "Discipline create violation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("violations")
  @RequirePermissions("discipline.create")
  async createViolation(
    @Body(new ZodValidationPipe(createViolationSchema.strict())) body: z.infer<typeof createViolationSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Discipline violation created", await this.service.createViolation(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Get Violation" })
  @ApiResponse({ status: 200, description: "Discipline get violation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("violations/:id")
  @RequirePermissions("discipline.view")
  async getViolation(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Discipline violation retrieved", await this.service.getViolation(id));
  }

  @ApiOperation({ summary: "Update Violation" })
  @ApiResponse({ status: 200, description: "Discipline update violation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("violations/:id")
  @RequirePermissions("discipline.update")
  async updateViolation(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateViolationSchema.strict())) body: z.infer<typeof updateViolationSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Discipline violation updated", await this.service.updateViolation(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete Violation" })
  @ApiResponse({ status: 200, description: "Discipline delete violation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("violations/:id")
  @RequirePermissions("discipline.delete")
  async deleteViolation(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Discipline violation deleted", await this.service.deleteViolation(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Confirm Violation" })
  @ApiResponse({ status: 200, description: "Discipline confirm violation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("violations/:id/confirm")
  @RequirePermissions("discipline.update")
  async confirmViolation(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Discipline violation confirmed", await this.service.confirmViolation(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Cancel Violation" })
  @ApiResponse({ status: 200, description: "Discipline cancel violation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("violations/:id/cancel")
  @RequirePermissions("discipline.update")
  async cancelViolation(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Discipline violation cancelled", await this.service.cancelViolation(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "List Achievements" })
  @ApiResponse({ status: 200, description: "Discipline list achievements" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("achievements")
  @RequirePermissions("discipline.view")
  async listAchievements(@Query() query: unknown) {
    const result = await this.service.listAchievements(query);
    return apiSuccess("Student achievements retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create Achievement" })
  @ApiResponse({ status: 200, description: "Discipline create achievement" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("achievements")
  @RequirePermissions("discipline.create")
  async createAchievement(
    @Body(new ZodValidationPipe(createAchievementSchema.strict())) body: z.infer<typeof createAchievementSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Student achievement created", await this.service.createAchievement(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Get Achievement" })
  @ApiResponse({ status: 200, description: "Discipline get achievement" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("achievements/:id")
  @RequirePermissions("discipline.view")
  async getAchievement(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Student achievement retrieved", await this.service.getAchievement(id));
  }

  @ApiOperation({ summary: "Update Achievement" })
  @ApiResponse({ status: 200, description: "Discipline update achievement" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("achievements/:id")
  @RequirePermissions("discipline.update")
  async updateAchievement(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateAchievementSchema.strict())) body: z.infer<typeof updateAchievementSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Student achievement updated", await this.service.updateAchievement(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete Achievement" })
  @ApiResponse({ status: 200, description: "Discipline delete achievement" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("achievements/:id")
  @RequirePermissions("discipline.delete")
  async deleteAchievement(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Student achievement deleted", await this.service.deleteAchievement(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Student Summary" })
  @ApiResponse({ status: 200, description: "Discipline student summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("students/:studentId/summary")
  @RequirePermissions("discipline.report")
  async studentSummary(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess(
      "Student discipline summary retrieved",
      await this.service.getStudentSummary(studentId, user, getRequestMeta(request)),
    );
  }

  @ApiOperation({ summary: "Classroom Summary" })
  @ApiResponse({ status: 200, description: "Discipline classroom summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("classrooms/:classroomId/summary")
  @RequirePermissions("discipline.report")
  async classroomSummary(
    @Param("classroomId") classroomId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess(
      "Classroom discipline summary retrieved",
      await this.service.getClassroomSummary(classroomId, user, getRequestMeta(request)),
    );
  }

  @ApiOperation({ summary: "Print Violation" })
  @ApiResponse({ status: 200, description: "Discipline print violation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("violations/:id/print")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("discipline.print")
  async printViolation(
    @Param("id", ParseCuidPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const result = await this.service.printViolation(id, user, getRequestMeta(request));
    this.sendPdf(res, result.buffer, result.filename);
  }

  @ApiOperation({ summary: "Print Student Summary" })
  @ApiResponse({ status: 200, description: "Discipline print student summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("students/:studentId/summary.pdf")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("discipline.print")
  async printStudentSummary(
    @Param("studentId") studentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const result = await this.service.printStudentSummary(studentId, user, getRequestMeta(request));
    this.sendPdf(res, result.buffer, result.filename);
  }

  private sendPdf(res: Response, buffer: Buffer, filename: string) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.end(buffer);
  }
}
