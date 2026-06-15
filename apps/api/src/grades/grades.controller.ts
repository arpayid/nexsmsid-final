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
import { approveScoreSchema, createAssessmentSchema, inputScoresSchema, updateAssessmentSchema } from "./grades.dto";
import { GradesService } from "./grades.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Grades")
@ApiBearerAuth()
export class GradesController {
  constructor(
    @Inject(GradesService) private readonly service: GradesService,
    @Inject(PrintDocumentService) private readonly printService: PrintDocumentService,
  ) {}

  @ApiOperation({ summary: "List Assessments" })
  @ApiResponse({ status: 200, description: "Grades list assessments" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("grades/assessments")
  @RequirePermissions("grades.view")
  async listAssessments(@Query() query: unknown) {
    const result = await this.service.listAssessments(query);
    return apiSuccess("Assessments retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find Assessment By Id" })
  @ApiResponse({ status: 200, description: "Grades find assessment by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("grades/assessments/:id")
  @RequirePermissions("grades.view")
  async findAssessmentById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Assessment retrieved", await this.service.findAssessmentById(id));
  }

  @ApiOperation({ summary: "Create Assessment" })
  @ApiResponse({ status: 200, description: "Grades create assessment" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("grades/assessments")
  @RequirePermissions("grades.input")
  async createAssessment(
    @Body(new ZodValidationPipe(createAssessmentSchema.strict())) body: z.infer<typeof createAssessmentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Assessment created", await this.service.createAssessment(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Update Assessment" })
  @ApiResponse({ status: 200, description: "Grades update assessment" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("grades/assessments/:id")
  @RequirePermissions("grades.update")
  async updateAssessment(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateAssessmentSchema.strict())) body: z.infer<typeof updateAssessmentSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Assessment updated", await this.service.updateAssessment(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Input Scores" })
  @ApiResponse({ status: 200, description: "Grades input scores" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("grades/assessments/:id/scores")
  @RequirePermissions("grades.input")
  async inputScores(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(inputScoresSchema.strict())) body: z.infer<typeof inputScoresSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Scores inputted", await this.service.inputScores(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Approve Scores" })
  @ApiResponse({ status: 200, description: "Grades approve scores" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("grades/assessments/:id/approve")
  @RequirePermissions("grades.approve")
  async approveScores(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(approveScoreSchema.strict())) body: z.infer<typeof approveScoreSchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Scores approved", await this.service.approveScores(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Get Student Summary" })
  @ApiResponse({ status: 200, description: "Grades get student summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("grades/students/:studentId/summary")
  @RequirePermissions("grades.view")
  async getStudentSummary(@Param("studentId", ParseCuidPipe) studentId: string) {
    return apiSuccess("Grade summary retrieved", await this.service.getStudentSummary(studentId));
  }

  @ApiOperation({ summary: "Get Classroom Summary" })
  @ApiResponse({ status: 200, description: "Grades get classroom summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("grades/classrooms/:classroomId/summary")
  @RequirePermissions("grades.view")
  async getClassroomSummary(@Param("classroomId", ParseCuidPipe) classroomId: string) {
    return apiSuccess("Grade summary retrieved", await this.service.getClassroomSummary(classroomId));
  }

  @ApiOperation({ summary: "Download Classroom Recap" })
  @ApiResponse({ status: 200, description: "Grades download classroom recap" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("grades/classrooms/:classroomId/recap.pdf")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("grades.print")
  async downloadClassroomRecap(
    @Param("classroomId", ParseCuidPipe) classroomId: string,
    @Query("semesterId") semesterId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const buffer = await this.printService.renderGradeRecap(classroomId, semesterId);
    await this.printService.logPrint("grades.recap.print", "classroom", classroomId, user, getRequestMeta(request), {
      semesterId: semesterId ?? null,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="grade-recap-${classroomId}.pdf"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.end(buffer);
  }
}
