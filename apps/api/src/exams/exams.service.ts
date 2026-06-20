import { Inject, Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { capListLimit } from "../common/pagination";

type PaginationQuery = { limit?: string | number; page?: string | number; search?: string };

const examInclude = {
  examType: true,
  academicYear: true,
  semester: true,
  _count: { select: { schedules: true, participants: true, questions: true } },
} satisfies Prisma.ExamInclude;

const scheduleInclude = {
  room: true,
  supervisor: { include: { user: { select: { id: true, name: true } } } },
  sessions: { include: { _count: { select: { participants: true, attendances: true } } } },
} satisfies Prisma.ExamScheduleInclude;

@Injectable()
export class ExamsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private getPagination(query?: { page?: string | number; limit?: string | number }) {
    const rawPage = Number(query?.page ?? 1);
    const rawLimit = Number(query?.limit ?? 20);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit = capListLimit(rawLimit, 20);

    return {
      page,
      limit,
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  // ── Exam Types ──────────────────────────────────────────────
  async listExamTypes(query: PaginationQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.ExamTypeWhereInput = { deletedAt: null };
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.examType.findMany({ where, skip, take, orderBy: { name: "asc" } }),
      this.prisma.examType.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getExamType(id: string) {
    const type = await this.prisma.examType.findFirst({ where: { id, deletedAt: null } });
    if (!type) throw new NotFoundException("Exam type not found");
    return type;
  }

  async createExamType(data: { code: string; name: string; description?: string }) {
    const existing = await this.prisma.examType.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException("Exam type code already exists");
    return this.prisma.examType.create({ data });
  }

  async updateExamType(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    await this.getExamType(id);
    return this.prisma.examType.update({ where: { id }, data });
  }

  async deleteExamType(id: string) {
    await this.getExamType(id);
    return this.prisma.examType.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Exam Rooms ──────────────────────────────────────────────
  async listRooms(query: PaginationQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.ExamRoomWhereInput = { deletedAt: null };
    if (query.search)
      where.OR = [{ code: { contains: query.search, mode: "insensitive" } }, { name: { contains: query.search, mode: "insensitive" } }];
    const [data, total] = await Promise.all([
      this.prisma.examRoom.findMany({ where, skip, take, orderBy: { code: "asc" } }),
      this.prisma.examRoom.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getRoom(id: string) {
    const room = await this.prisma.examRoom.findFirst({ where: { id, deletedAt: null } });
    if (!room) throw new NotFoundException("Exam room not found");
    return room;
  }

  async createRoom(data: { code: string; name: string; capacity?: number; location?: string }) {
    const existing = await this.prisma.examRoom.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException("Room code already exists");
    return this.prisma.examRoom.create({ data });
  }

  async updateRoom(id: string, data: { name?: string; capacity?: number; location?: string; isActive?: boolean }) {
    await this.getRoom(id);
    return this.prisma.examRoom.update({ where: { id }, data });
  }

  async deleteRoom(id: string) {
    await this.getRoom(id);
    return this.prisma.examRoom.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Exams ───────────────────────────────────────────────────
  async listExams(query: PaginationQuery & { status?: string; examTypeId?: string; academicYearId?: string }) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.ExamWhereInput = { deletedAt: null };
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };
    if (query.status) where.status = query.status as any;
    if (query.examTypeId) where.examTypeId = query.examTypeId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    const [data, total] = await Promise.all([
      this.prisma.exam.findMany({ where, include: examInclude, skip, take, orderBy: { createdAt: "desc" } }),
      this.prisma.exam.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getExam(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: { ...examInclude, schedules: { include: scheduleInclude, where: { deletedAt: null }, orderBy: { date: "asc" } } },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    return exam;
  }

  async createExam(data: Prisma.ExamCreateInput) {
    return this.prisma.exam.create({ data, include: examInclude });
  }

  async updateExam(id: string, data: Prisma.ExamUpdateInput) {
    await this.getExam(id);
    return this.prisma.exam.update({ where: { id }, data, include: examInclude });
  }

  async deleteExam(id: string) {
    await this.getExam(id);
    return this.prisma.exam.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async updateExamStatus(id: string, status: string) {
    const exam = await this.getExam(id);
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["SCHEDULED", "CANCELLED"],
      SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED"],
      COMPLETED: ["GRADED", "CANCELLED"],
      GRADED: [],
      CANCELLED: [],
    };
    const allowed = validTransitions[exam.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`Cannot transition from ${exam.status} to ${status}`);
    return this.prisma.exam.update({ where: { id }, data: { status: status as any }, include: examInclude });
  }

  // ── Participants ────────────────────────────────────────────
  async listParticipants(examId: string, query: PaginationQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.ExamParticipantWhereInput = { examId, deletedAt: null };
    if (query.search) where.student = { name: { contains: query.search, mode: "insensitive" } };
    const [data, total] = await Promise.all([
      this.prisma.examParticipant.findMany({
        where,
        skip,
        take,
        include: { student: { include: { user: { select: { id: true, name: true } } } }, session: true },
        orderBy: { number: "asc" },
      }),
      this.prisma.examParticipant.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async addParticipant(examId: string, studentId: string) {
    await this.getExam(examId);
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException("Student not found");
    const existing = await this.prisma.examParticipant.findFirst({ where: { examId, studentId, deletedAt: null } });
    if (existing) throw new ConflictException("Student already registered for this exam");
    const maxNumber = await this.prisma.examParticipant.aggregate({ where: { examId }, _max: { number: true } });
    return this.prisma.examParticipant.create({
      data: { examId, studentId, number: (maxNumber._max.number ?? 0) + 1 },
      include: { student: { include: { user: { select: { id: true, name: true } } } } },
    });
  }

  async addParticipantsBulk(examId: string, studentIds: string[]) {
    await this.getExam(examId);
    const existing = await this.prisma.examParticipant.findMany({
      where: { examId, studentId: { in: studentIds }, deletedAt: null },
      select: { studentId: true },
    });
    const existingIds = new Set(existing.map((e) => e.studentId));
    const newIds = studentIds.filter((id) => !existingIds.has(id));
    if (newIds.length === 0) return { added: 0, skipped: studentIds.length };
    const maxNumber = await this.prisma.examParticipant.aggregate({ where: { examId }, _max: { number: true } });
    let nextNumber = (maxNumber._max.number ?? 0) + 1;
    await this.prisma.examParticipant.createMany({
      data: newIds.map((studentId) => ({ examId, studentId, number: nextNumber++ })),
    });
    return { added: newIds.length, skipped: studentIds.length - newIds.length };
  }

  async removeParticipant(examId: string, participantId: string) {
    const participant = await this.prisma.examParticipant.findFirst({ where: { id: participantId, examId, deletedAt: null } });
    if (!participant) throw new NotFoundException("Participant not found");
    return this.prisma.examParticipant.update({ where: { id: participantId }, data: { deletedAt: new Date() } });
  }

  async updateParticipantStatus(examId: string, participantId: string, status: string) {
    const participant = await this.prisma.examParticipant.findFirst({ where: { id: participantId, examId, deletedAt: null } });
    if (!participant) throw new NotFoundException("Participant not found");
    return this.prisma.examParticipant.update({ where: { id: participantId }, data: { status: status as any } });
  }

  // ── Schedules & Sessions ────────────────────────────────────
  async listSchedules(examId: string) {
    return this.prisma.examSchedule.findMany({
      where: { examId, deletedAt: null },
      include: scheduleInclude,
      orderBy: { date: "asc" },
    });
  }

  async createSchedule(examId: string, data: Prisma.ExamScheduleUncheckedCreateInput) {
    await this.getExam(examId);
    return this.prisma.examSchedule.create({ data: { ...data, examId }, include: scheduleInclude });
  }

  async updateSchedule(id: string, data: Prisma.ExamScheduleUpdateInput) {
    return this.prisma.examSchedule.update({ where: { id }, data, include: scheduleInclude });
  }

  async deleteSchedule(id: string) {
    const schedule = await this.prisma.examSchedule.findFirst({ where: { id, deletedAt: null } });
    if (!schedule) throw new NotFoundException("Schedule not found");
    return this.prisma.examSchedule.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listSessions(scheduleId: string) {
    return this.prisma.examSession.findMany({
      where: { scheduleId, deletedAt: null },
      include: { _count: { select: { participants: true, attendances: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async createSession(scheduleId: string, data: { code: string; name?: string }) {
    const schedule = await this.prisma.examSchedule.findFirst({ where: { id: scheduleId, deletedAt: null } });
    if (!schedule) throw new NotFoundException("Schedule not found");
    return this.prisma.examSession.create({ data: { ...data, scheduleId } });
  }

  async updateSessionStatus(id: string, status: string) {
    return this.prisma.examSession.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
        ...(status === "COMPLETED" ? { endedAt: new Date() } : {}),
      },
    });
  }

  // ── Questions ────────────────────────────────────────────────
  async listQuestions(examId: string) {
    return this.prisma.examQuestion.findMany({
      where: { examId, deletedAt: null },
      orderBy: { number: "asc" },
    });
  }

  async addQuestion(examId: string, data: Prisma.ExamQuestionUncheckedCreateInput) {
    await this.getExam(examId);
    return this.prisma.examQuestion.create({ data: { ...data, examId } });
  }

  async updateQuestion(id: string, data: Prisma.ExamQuestionUpdateInput) {
    return this.prisma.examQuestion.update({ where: { id }, data });
  }

  async deleteQuestion(id: string) {
    return this.prisma.examQuestion.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Question Banks ────────────────────────────────────────────
  async listBanks(query: PaginationQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.QuestionBankWhereInput = { deletedAt: null };
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.questionBank.findMany({ where, skip, take, orderBy: { name: "asc" } }),
      this.prisma.questionBank.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createBank(data: { code: string; name: string; description?: string }) {
    const existing = await this.prisma.questionBank.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException("Question bank code already exists");
    return this.prisma.questionBank.create({ data });
  }

  // ── Results ─────────────────────────────────────────────────
  async checkInParticipant(sessionId: string, participantId: string) {
    const session = await this.prisma.examSession.findFirst({ where: { id: sessionId, deletedAt: null } });
    if (!session) throw new NotFoundException("Session not found");

    const participant = await this.prisma.examParticipant.findFirst({
      where: { id: participantId, sessionId, deletedAt: null },
    });
    if (!participant) throw new NotFoundException("Participant not found in this session");

    await this.prisma.examAttendance.upsert({
      where: { sessionId_participantId: { sessionId, participantId } },
      create: { sessionId, participantId, checkInAt: new Date() },
      update: { checkInAt: new Date() },
    });

    return this.prisma.examParticipant.update({
      where: { id: participantId },
      data: { status: "PRESENT" },
      include: { student: true },
    });
  }

  async submitParticipantResults(
    examId: string,
    participantId: string,
    answers: Array<{ questionId: string; answer: string }>,
    gradedById: string,
  ) {
    const participant = await this.prisma.examParticipant.findFirst({ where: { id: participantId, examId, deletedAt: null } });
    if (!participant) throw new NotFoundException("Participant not found");

    return this.prisma.$transaction(async (tx) => {
      let totalScore = 0;
      
      const questionIds = answers.map((a) => a.questionId);
      const questions = await tx.examQuestion.findMany({
        where: { id: { in: questionIds }, examId, deletedAt: null },
      });
      const questionsMap = new Map(questions.map((q) => [q.id, q]));

      const existingResults = await tx.examResult.findMany({
        where: { examId, participantId, questionId: { in: questionIds } },
      });
      const existingResultsMap = new Map(existingResults.map((r) => [r.questionId, r]));

      for (const item of answers) {
        const question = questionsMap.get(item.questionId);
        if (!question) continue;

        const normalizedAnswer = item.answer.trim();
        const isCorrect = question.correctAnswer ? question.correctAnswer.trim() === normalizedAnswer : null;
        const score = isCorrect ? question.score : 0;
        if (isCorrect) totalScore += question.score;

        const existing = existingResultsMap.get(item.questionId);

        if (existing) {
          await tx.examResult.update({
            where: { id: existing.id },
            data: { answer: normalizedAnswer, isCorrect, score, gradedAt: new Date(), gradedById },
          });
        } else {
          await tx.examResult.create({
            data: {
              examId,
              participantId,
              questionId: item.questionId,
              answer: normalizedAnswer,
              isCorrect,
              score,
              gradedAt: new Date(),
              gradedById,
            },
          });
        }
      }

      return tx.examParticipant.update({
        where: { id: participantId },
        data: { score: totalScore, status: "PRESENT" },
        include: { student: true, results: true },
      });
    });
  }

  async gradeParticipant(examId: string, participantId: string, data: { score: number; notes?: string }) {
    const participant = await this.prisma.examParticipant.findFirst({ where: { id: participantId, examId, deletedAt: null } });
    if (!participant) throw new NotFoundException("Participant not found");

    return this.prisma.examParticipant.update({
      where: { id: participantId },
      data: { score: data.score, notes: data.notes ?? participant.notes },
      include: { student: true, results: true },
    });
  }

  async listResults(examId: string, query: PaginationQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.ExamResultWhereInput = { examId };
    const [data, total] = await Promise.all([
      this.prisma.examResult.findMany({
        where,
        skip,
        take,
        include: { participant: { include: { student: { include: { user: { select: { id: true, name: true } } } } } }, question: true },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.examResult.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
