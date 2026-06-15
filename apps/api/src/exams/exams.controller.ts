import { Body, Controller, Delete, Get, Header, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

import { z } from "zod";
import type { Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { AuthenticatedUser, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import {
  addExamQuestionSchema,
  createExamRoomSchema,
  createExamScheduleSchema,
  createExamSchema,
  createExamSessionSchema,
  createExamTypeSchema,
  createQuestionBankSchema,
  gradeParticipantSchema,
  submitParticipantResultsSchema,
  updateExamQuestionSchema,
  updateExamRoomSchema,
  updateExamScheduleSchema,
  updateExamSchema,
  updateExamTypeSchema,
} from "./dto/create-exam.dto";
import { ExamsService } from "./exams.service";
import { ExamPdfService } from "./exam-pdf.service";
import { ExamReportService } from "./exam-report.service";

type ExamsPaginationQuery = { limit?: string | number; page?: string | number; search?: string };
type ExamsListQuery = ExamsPaginationQuery & { status?: string; examTypeId?: string; academicYearId?: string };

@Controller("exams")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Exams")
@ApiBearerAuth()
export class ExamsController {
  constructor(
    @Inject(ExamsService) private readonly service: ExamsService,
    @Inject(ExamPdfService) private readonly pdfService: ExamPdfService,
    @Inject(ExamReportService) private readonly reportService: ExamReportService,
  ) {}

  // ── Exam Types ──────────────────────────────────────────────
  @ApiOperation({ summary: "List Types" })
  @ApiResponse({ status: 200, description: "Exams list types" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("types")
  @RequirePermissions("exams.view")
  async listTypes(@Query() query: unknown) {
    const data = await this.service.listExamTypes(query as ExamsPaginationQuery);
    return apiSuccess("Exam types retrieved", data.data, data.meta);
  }

  @ApiOperation({ summary: "Create Type" })
  @ApiResponse({ status: 200, description: "Exams create type" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("types")
  @RequirePermissions("exams.create")
  async createType(@Body(new ZodValidationPipe(createExamTypeSchema.strict())) body: z.infer<typeof createExamTypeSchema>) {
    const data = await this.service.createExamType(body);
    return apiSuccess("Exam type created", data);
  }

  @ApiOperation({ summary: "Get Type" })
  @ApiResponse({ status: 200, description: "Exams get type" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("types/:id")
  @RequirePermissions("exams.view")
  async getType(@Param("id", ParseCuidPipe) id: string) {
    const data = await this.service.getExamType(id);
    return apiSuccess("Exam type retrieved", data);
  }

  @ApiOperation({ summary: "Update Type" })
  @ApiResponse({ status: 200, description: "Exams update type" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("types/:id")
  @RequirePermissions("exams.update")
  async updateType(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateExamTypeSchema.strict())) body: z.infer<typeof updateExamTypeSchema>,
  ) {
    const data = await this.service.updateExamType(id, body);
    return apiSuccess("Exam type updated", data);
  }

  @ApiOperation({ summary: "Delete Type" })
  @ApiResponse({ status: 200, description: "Exams delete type" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("types/:id")
  @RequirePermissions("exams.delete")
  async deleteType(@Param("id", ParseCuidPipe) id: string) {
    const data = await this.service.deleteExamType(id);
    return apiSuccess("Exam type deleted", data);
  }

  // ── Exam Rooms ──────────────────────────────────────────────
  @ApiOperation({ summary: "List Rooms" })
  @ApiResponse({ status: 200, description: "Exams list rooms" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("rooms")
  @RequirePermissions("exams.view")
  async listRooms(@Query() query: unknown) {
    const data = await this.service.listRooms(query as ExamsPaginationQuery);
    return apiSuccess("Exam rooms retrieved", data.data, data.meta);
  }

  @ApiOperation({ summary: "Create Room" })
  @ApiResponse({ status: 200, description: "Exams create room" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("rooms")
  @RequirePermissions("exams.create")
  async createRoom(@Body(new ZodValidationPipe(createExamRoomSchema.strict())) body: z.infer<typeof createExamRoomSchema>) {
    const data = await this.service.createRoom(body);
    return apiSuccess("Exam room created", data);
  }

  @ApiOperation({ summary: "Get Room" })
  @ApiResponse({ status: 200, description: "Exams get room" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("rooms/:id")
  @RequirePermissions("exams.view")
  async getRoom(@Param("id", ParseCuidPipe) id: string) {
    const data = await this.service.getRoom(id);
    return apiSuccess("Exam room retrieved", data);
  }

  @ApiOperation({ summary: "Update Room" })
  @ApiResponse({ status: 200, description: "Exams update room" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("rooms/:id")
  @RequirePermissions("exams.update")
  async updateRoom(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateExamRoomSchema.strict())) body: z.infer<typeof updateExamRoomSchema>,
  ) {
    const data = await this.service.updateRoom(id, body);
    return apiSuccess("Exam room updated", data);
  }

  @ApiOperation({ summary: "Delete Room" })
  @ApiResponse({ status: 200, description: "Exams delete room" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("rooms/:id")
  @RequirePermissions("exams.delete")
  async deleteRoom(@Param("id", ParseCuidPipe) id: string) {
    const data = await this.service.deleteRoom(id);
    return apiSuccess("Exam room deleted", data);
  }

  // ── Exams ───────────────────────────────────────────────────
  @ApiOperation({ summary: "List Exams" })
  @ApiResponse({ status: 200, description: "Exams list exams" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("exams.view")
  async listExams(@Query() query: unknown) {
    const data = await this.service.listExams(query as ExamsListQuery);
    return apiSuccess("Exams retrieved", data.data, data.meta);
  }

  @ApiOperation({ summary: "Create Exam" })
  @ApiResponse({ status: 200, description: "Exams create exam" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("exams.create")
  async createExam(@Body(new ZodValidationPipe(createExamSchema.strict())) body: z.infer<typeof createExamSchema>) {
    const data = await this.service.createExam(body as unknown as Prisma.ExamCreateInput);
    return apiSuccess("Exam created", data);
  }

  @ApiOperation({ summary: "Summary" })
  @ApiResponse({ status: 200, description: "Exams summary" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("summary")
  @RequirePermissions("exams.view")
  async summary() {
    const data = await this.reportService.getSummary();
    return apiSuccess("Exam summary retrieved", data);
  }

  @ApiOperation({ summary: "List Banks" })
  @ApiResponse({ status: 200, description: "Exams list banks" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("banks")
  @RequirePermissions("exams.view")
  async listBanks(@Query() query: unknown) {
    const data = await this.service.listBanks(query as ExamsPaginationQuery);
    return apiSuccess("Question banks retrieved", data.data, data.meta);
  }

  @ApiOperation({ summary: "Create Bank" })
  @ApiResponse({ status: 200, description: "Exams create bank" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("banks")
  @RequirePermissions("exams.create")
  async createBank(@Body(new ZodValidationPipe(createQuestionBankSchema.strict())) body: z.infer<typeof createQuestionBankSchema>) {
    const data = await this.service.createBank(body);
    return apiSuccess("Question bank created", data);
  }

  @ApiOperation({ summary: "Get Exam" })
  @ApiResponse({ status: 200, description: "Exams get exam" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("exams.view")
  async getExam(@Param("id", ParseCuidPipe) id: string) {
    const data = await this.service.getExam(id);
    return apiSuccess("Exam retrieved", data);
  }

  @ApiOperation({ summary: "Update Exam" })
  @ApiResponse({ status: 200, description: "Exams update exam" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("exams.update")
  async updateExam(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateExamSchema.strict())) body: z.infer<typeof updateExamSchema>,
  ) {
    const data = await this.service.updateExam(id, body as Prisma.ExamUncheckedUpdateInput);
    return apiSuccess("Exam updated", data);
  }

  @ApiOperation({ summary: "Delete Exam" })
  @ApiResponse({ status: 200, description: "Exams delete exam" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("exams.delete")
  async deleteExam(@Param("id", ParseCuidPipe) id: string) {
    const data = await this.service.deleteExam(id);
    return apiSuccess("Exam deleted", data);
  }

  @ApiOperation({ summary: "Update Status" })
  @ApiResponse({ status: 200, description: "Exams update status" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/status")
  @RequirePermissions("exams.update")
  async updateStatus(@Param("id", ParseCuidPipe) id: string, @Body() body: { status: string }) {
    const data = await this.service.updateExamStatus(id, body.status);
    return apiSuccess("Exam status updated", data);
  }

  // ── Participants ────────────────────────────────────────────
  @ApiOperation({ summary: "List Participants" })
  @ApiResponse({ status: 200, description: "Exams list participants" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/participants")
  @RequirePermissions("exams.participants")
  async listParticipants(@Param("id", ParseCuidPipe) id: string, @Query() query: unknown) {
    const data = await this.service.listParticipants(id, query as ExamsPaginationQuery);
    return apiSuccess("Participants retrieved", data.data, data.meta);
  }

  @ApiOperation({ summary: "Add Participant" })
  @ApiResponse({ status: 200, description: "Exams add participant" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/participants")
  @RequirePermissions("exams.participants")
  async addParticipant(@Param("id", ParseCuidPipe) id: string, @Body() body: { studentId: string }) {
    const data = await this.service.addParticipant(id, body.studentId);
    return apiSuccess("Participant added", data);
  }

  @ApiOperation({ summary: "Add Participants Bulk" })
  @ApiResponse({ status: 200, description: "Exams add participants bulk" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/participants/bulk")
  @RequirePermissions("exams.participants")
  async addParticipantsBulk(@Param("id", ParseCuidPipe) id: string, @Body() body: { studentIds: string[] }) {
    const data = await this.service.addParticipantsBulk(id, body.studentIds);
    return apiSuccess("Participants added", data);
  }

  @ApiOperation({ summary: "Remove Participant" })
  @ApiResponse({ status: 200, description: "Exams remove participant" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id/participants/:participantId")
  @RequirePermissions("exams.participants")
  async removeParticipant(@Param("id", ParseCuidPipe) id: string, @Param("participantId", ParseCuidPipe) participantId: string) {
    const data = await this.service.removeParticipant(id, participantId);
    return apiSuccess("Participant removed", data);
  }

  @ApiOperation({ summary: "Update Participant Status" })
  @ApiResponse({ status: 200, description: "Exams update participant status" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id/participants/:participantId/status")
  @RequirePermissions("exams.participants")
  async updateParticipantStatus(
    @Param("id", ParseCuidPipe) id: string,
    @Param("participantId", ParseCuidPipe) participantId: string,
    @Body() body: { status: string },
  ) {
    const data = await this.service.updateParticipantStatus(id, participantId, body.status);
    return apiSuccess("Participant status updated", data);
  }

  // ── Schedules ───────────────────────────────────────────────
  @ApiOperation({ summary: "List Schedules" })
  @ApiResponse({ status: 200, description: "Exams list schedules" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/schedules")
  @RequirePermissions("exams.schedule")
  async listSchedules(@Param("id", ParseCuidPipe) id: string) {
    const data = await this.service.listSchedules(id);
    return apiSuccess("Schedules retrieved", data);
  }

  @ApiOperation({ summary: "Create Schedule" })
  @ApiResponse({ status: 200, description: "Exams create schedule" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/schedules")
  @RequirePermissions("exams.schedule")
  async createSchedule(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(createExamScheduleSchema.strict())) body: z.infer<typeof createExamScheduleSchema>,
  ) {
    const data = await this.service.createSchedule(id, body as Prisma.ExamScheduleUncheckedCreateInput);
    return apiSuccess("Schedule created", data);
  }

  @ApiOperation({ summary: "Update Schedule" })
  @ApiResponse({ status: 200, description: "Exams update schedule" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("schedules/:scheduleId")
  @RequirePermissions("exams.schedule")
  async updateSchedule(
    @Param("scheduleId", ParseCuidPipe) scheduleId: string,
    @Body(new ZodValidationPipe(updateExamScheduleSchema.strict())) body: z.infer<typeof updateExamScheduleSchema>,
  ) {
    const data = await this.service.updateSchedule(scheduleId, body as Prisma.ExamScheduleUpdateInput);
    return apiSuccess("Schedule updated", data);
  }

  @ApiOperation({ summary: "Delete Schedule" })
  @ApiResponse({ status: 200, description: "Exams delete schedule" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("schedules/:scheduleId")
  @RequirePermissions("exams.schedule")
  async deleteSchedule(@Param("scheduleId", ParseCuidPipe) scheduleId: string) {
    const data = await this.service.deleteSchedule(scheduleId);
    return apiSuccess("Schedule deleted", data);
  }

  // ── Sessions ────────────────────────────────────────────────
  @ApiOperation({ summary: "List Sessions" })
  @ApiResponse({ status: 200, description: "Exams list sessions" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("schedules/:scheduleId/sessions")
  @RequirePermissions("exams.schedule")
  async listSessions(@Param("scheduleId") scheduleId: string) {
    const data = await this.service.listSessions(scheduleId);
    return apiSuccess("Sessions retrieved", data);
  }

  @ApiOperation({ summary: "Create Session" })
  @ApiResponse({ status: 200, description: "Exams create session" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("schedules/:scheduleId/sessions")
  @RequirePermissions("exams.schedule")
  async createSession(
    @Param("scheduleId", ParseCuidPipe) scheduleId: string,
    @Body(new ZodValidationPipe(createExamSessionSchema.strict())) body: z.infer<typeof createExamSessionSchema>,
  ) {
    const data = await this.service.createSession(scheduleId, body);
    return apiSuccess("Session created", data);
  }

  @ApiOperation({ summary: "Update Session Status" })
  @ApiResponse({ status: 200, description: "Exams update session status" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("sessions/:sessionId/status")
  @RequirePermissions("exams.schedule")
  async updateSessionStatus(@Param("sessionId", ParseCuidPipe) sessionId: string, @Body() body: { status: string }) {
    const data = await this.service.updateSessionStatus(sessionId, body.status);
    return apiSuccess("Session status updated", data);
  }

  @ApiOperation({ summary: "Check in exam participant" })
  @Post("sessions/:sessionId/participants/:participantId/check-in")
  @RequirePermissions("exams.participants")
  async checkInParticipant(
    @Param("sessionId", ParseCuidPipe) sessionId: string,
    @Param("participantId", ParseCuidPipe) participantId: string,
  ) {
    const data = await this.service.checkInParticipant(sessionId, participantId);
    return apiSuccess("Participant checked in", data);
  }

  @ApiOperation({ summary: "Submit participant exam results" })
  @Post(":examId/participants/:participantId/results")
  @RequirePermissions("exams.update")
  async submitParticipantResults(
    @Param("examId", ParseCuidPipe) examId: string,
    @Param("participantId", ParseCuidPipe) participantId: string,
    @Body(new ZodValidationPipe(submitParticipantResultsSchema.strict())) body: z.infer<typeof submitParticipantResultsSchema>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const answers = body.answers ?? [];
    const data = await this.service.submitParticipantResults(examId, participantId, answers, user.id);
    return apiSuccess("Participant results submitted", data);
  }

  @ApiOperation({ summary: "Grade exam participant" })
  @Post(":examId/participants/:participantId/grade")
  @RequirePermissions("exams.update")
  async gradeParticipant(
    @Param("examId", ParseCuidPipe) examId: string,
    @Param("participantId", ParseCuidPipe) participantId: string,
    @Body(new ZodValidationPipe(gradeParticipantSchema.strict())) body: z.infer<typeof gradeParticipantSchema>,
  ) {
    const data = await this.service.gradeParticipant(examId, participantId, body);
    return apiSuccess("Participant graded", data);
  }

  // ── Questions ───────────────────────────────────────────────
  @ApiOperation({ summary: "List Questions" })
  @ApiResponse({ status: 200, description: "Exams list questions" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/questions")
  @RequirePermissions("exams.view")
  async listQuestions(@Param("id", ParseCuidPipe) id: string) {
    const data = await this.service.listQuestions(id);
    return apiSuccess("Questions retrieved", data);
  }

  @ApiOperation({ summary: "Add Question" })
  @ApiResponse({ status: 200, description: "Exams add question" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/questions")
  @RequirePermissions("exams.create")
  async addQuestion(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(addExamQuestionSchema.strict())) body: z.infer<typeof addExamQuestionSchema>,
  ) {
    const data = await this.service.addQuestion(id, body as Prisma.ExamQuestionUncheckedCreateInput);
    return apiSuccess("Question added", data);
  }

  @ApiOperation({ summary: "Update Question" })
  @ApiResponse({ status: 200, description: "Exams update question" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch("questions/:questionId")
  @RequirePermissions("exams.update")
  async updateQuestion(
    @Param("questionId", ParseCuidPipe) questionId: string,
    @Body(new ZodValidationPipe(updateExamQuestionSchema.strict())) body: z.infer<typeof updateExamQuestionSchema>,
  ) {
    const data = await this.service.updateQuestion(questionId, body as Prisma.ExamQuestionUpdateInput);
    return apiSuccess("Question updated", data);
  }

  @ApiOperation({ summary: "Delete Question" })
  @ApiResponse({ status: 200, description: "Exams delete question" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete("questions/:questionId")
  @RequirePermissions("exams.delete")
  async deleteQuestion(@Param("questionId", ParseCuidPipe) questionId: string) {
    const data = await this.service.deleteQuestion(questionId);
    return apiSuccess("Question deleted", data);
  }

  // ── Results ─────────────────────────────────────────────────
  @ApiOperation({ summary: "List Results" })
  @ApiResponse({ status: 200, description: "Exams list results" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/results")
  @RequirePermissions("exams.view")
  async listResults(@Param("id", ParseCuidPipe) id: string, @Query() query: unknown) {
    const data = await this.service.listResults(id, query as ExamsPaginationQuery);
    return apiSuccess("Results retrieved", data.data, data.meta);
  }

  // ── PDF (Exam Card) ─────────────────────────────────────────
  @ApiOperation({ summary: "Print Exam Card" })
  @ApiResponse({ status: 200, description: "Exams print exam card" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/print-card")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("exams.print-card")
  async printExamCard(
    @Param("id", ParseCuidPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateExamCard(id, user, request);
    this.sendPdf(res, pdfBuffer, `exam-card-${id}.pdf`);
  }

  @ApiOperation({ summary: "Print Participant Card" })
  @ApiResponse({ status: 200, description: "Exams print participant card" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/print-card-participant/:participantId")
  @Header("Content-Type", "application/pdf")
  @RequirePermissions("exams.print-card")
  async printParticipantCard(
    @Param("id", ParseCuidPipe) id: string,
    @Param("participantId") participantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateParticipantCard(id, participantId, user, request);
    this.sendPdf(res, pdfBuffer, `exam-participant-card-${participantId}.pdf`);
  }

  // ── Reports ─────────────────────────────────────────────────
  @ApiOperation({ summary: "Generate Report" })
  @ApiResponse({ status: 200, description: "Exams generate report" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id/report")
  @RequirePermissions("exams.export")
  async generateReport(
    @Param("id", ParseCuidPipe) id: string,
    @Query("format") format: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res() res: Response,
  ) {
    const { buffer, contentType, filename } = await this.reportService.generateExamReport(id, format || "xlsx", user, request);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  private sendPdf(res: Response, buffer: Buffer, filename: string) {
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(buffer);
  }
}
