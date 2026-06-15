import type { ApiClientCore } from "../client";
import type {
  ExamBulkParticipantResult,
  ExamParticipantRecord,
  ExamQuestionRecord,
  ExamRecord,
  ExamResultRecord,
  ExamRoomRecord,
  ExamScheduleRecord,
  ExamSessionRecord,
  ExamSummaryRecord,
  ExamTypeRecord,
  ListQueryParams,
  PaginatedList,
  QuestionBankRecord,
} from "../types";

function toQueryString(params?: ListQueryParams | URLSearchParams): string {
  if (!params) return "";
  if (params instanceof URLSearchParams) {
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function createExamsApi({ request, downloadFile, triggerBrowserDownload, normalizeListResponse }: ApiClientCore) {
  return {
    // ── Exam / CBT Management ──────────────────────────────────────
    async listExamTypes(params?: ListQueryParams) {
      const response = await request<PaginatedList<ExamTypeRecord>>(`/exams/types${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getExamType(id: string) {
      const response = await request<ExamTypeRecord>(`/exams/types/${id}`);
      return response.data;
    },
    async createExamType(data: Record<string, unknown>) {
      const response = await request<ExamTypeRecord>("/exams/types", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateExamType(id: string, data: Record<string, unknown>) {
      const response = await request<ExamTypeRecord>(`/exams/types/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteExamType(id: string) {
      const response = await request<ExamTypeRecord>(`/exams/types/${id}`, { method: "DELETE" });
      return response.data;
    },

    async listExamRooms(params?: ListQueryParams) {
      const response = await request<PaginatedList<ExamRoomRecord>>(`/exams/rooms${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getExamRoom(id: string) {
      const response = await request<ExamRoomRecord>(`/exams/rooms/${id}`);
      return response.data;
    },
    async createExamRoom(data: Record<string, unknown>) {
      const response = await request<ExamRoomRecord>("/exams/rooms", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateExamRoom(id: string, data: Record<string, unknown>) {
      const response = await request<ExamRoomRecord>(`/exams/rooms/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteExamRoom(id: string) {
      const response = await request<ExamRoomRecord>(`/exams/rooms/${id}`, { method: "DELETE" });
      return response.data;
    },

    async listExams(params?: ListQueryParams) {
      const response = await request<PaginatedList<ExamRecord>>(`/exams${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getExam(id: string) {
      const response = await request<ExamRecord>(`/exams/${id}`);
      return response.data;
    },
    async createExam(data: Record<string, unknown>) {
      const response = await request<ExamRecord>("/exams", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateExam(id: string, data: Record<string, unknown>) {
      const response = await request<ExamRecord>(`/exams/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteExam(id: string) {
      const response = await request<ExamRecord>(`/exams/${id}`, { method: "DELETE" });
      return response.data;
    },
    async updateExamStatus(id: string, status: string) {
      const response = await request<ExamRecord>(`/exams/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
      return response.data;
    },
    async getExamSummary() {
      const response = await request<ExamSummaryRecord>("/exams/summary");
      return response.data;
    },

    async listExamParticipants(examId: string, params?: ListQueryParams) {
      const response = await request<PaginatedList<ExamParticipantRecord>>(`/exams/${examId}/participants${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async addExamParticipant(examId: string, studentId: string) {
      const response = await request<ExamParticipantRecord>(`/exams/${examId}/participants`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      return response.data;
    },
    async addExamParticipantsBulk(examId: string, studentIds: string[]) {
      const response = await request<ExamBulkParticipantResult>(`/exams/${examId}/participants/bulk`, {
        method: "POST",
        body: JSON.stringify({ studentIds }),
      });
      return response.data;
    },
    async removeExamParticipant(examId: string, participantId: string) {
      const response = await request<ExamParticipantRecord>(`/exams/${examId}/participants/${participantId}`, { method: "DELETE" });
      return response.data;
    },
    async updateExamParticipantStatus(examId: string, participantId: string, status: string) {
      const response = await request<ExamParticipantRecord>(`/exams/${examId}/participants/${participantId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return response.data;
    },

    async listExamSchedules(examId: string) {
      const response = await request<ExamScheduleRecord[]>(`/exams/${examId}/schedules`);
      return response.data;
    },
    async createExamSchedule(examId: string, data: Record<string, unknown>) {
      const response = await request<ExamScheduleRecord>(`/exams/${examId}/schedules`, { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateExamSchedule(scheduleId: string, data: Record<string, unknown>) {
      const response = await request<ExamScheduleRecord>(`/exams/schedules/${scheduleId}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteExamSchedule(scheduleId: string) {
      const response = await request<ExamScheduleRecord>(`/exams/schedules/${scheduleId}`, { method: "DELETE" });
      return response.data;
    },

    async listExamSessions(scheduleId: string) {
      const response = await request<ExamSessionRecord[]>(`/exams/schedules/${scheduleId}/sessions`);
      return response.data;
    },
    async createExamSession(scheduleId: string, data: Record<string, unknown>) {
      const response = await request<ExamSessionRecord>(`/exams/schedules/${scheduleId}/sessions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    async updateExamSessionStatus(sessionId: string, status: string) {
      const response = await request<ExamSessionRecord>(`/exams/sessions/${sessionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return response.data;
    },
    async checkInExamParticipant(sessionId: string, participantId: string) {
      const response = await request<ExamParticipantRecord>(`/exams/sessions/${sessionId}/participants/${participantId}/check-in`, {
        method: "POST",
      });
      return response.data;
    },
    async submitExamParticipantResults(examId: string, participantId: string, answers: Array<{ questionId: string; answer: string }>) {
      const response = await request<ExamParticipantRecord>(`/exams/${examId}/participants/${participantId}/results`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      return response.data;
    },
    async gradeExamParticipant(examId: string, participantId: string, input: { score: number; notes?: string }) {
      const response = await request<ExamParticipantRecord>(`/exams/${examId}/participants/${participantId}/grade`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },

    async listExamQuestions(examId: string) {
      const response = await request<ExamQuestionRecord[]>(`/exams/${examId}/questions`);
      return response.data;
    },
    async addExamQuestion(examId: string, data: Record<string, unknown>) {
      const response = await request<ExamQuestionRecord>(`/exams/${examId}/questions`, { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateExamQuestion(questionId: string, data: Record<string, unknown>) {
      const response = await request<ExamQuestionRecord>(`/exams/questions/${questionId}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteExamQuestion(questionId: string) {
      const response = await request<ExamQuestionRecord>(`/exams/questions/${questionId}`, { method: "DELETE" });
      return response.data;
    },

    async listExamBanks(params?: ListQueryParams) {
      const response = await request<PaginatedList<QuestionBankRecord>>(`/exams/banks${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async createExamBank(data: Record<string, unknown>) {
      const response = await request<QuestionBankRecord>("/exams/banks", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },

    async listExamResults(examId: string, params?: ListQueryParams) {
      const response = await request<PaginatedList<ExamResultRecord>>(`/exams/${examId}/results${toQueryString(params)}`);
      return normalizeListResponse(response);
    },

    async downloadExamCardPdf(examId: string) {
      const blob = await downloadFile(`/exams/${examId}/print-card`, `exam-card-${examId}.pdf`);
      triggerBrowserDownload(blob, `exam-card-${examId}.pdf`);
    },
    async downloadExamParticipantCardPdf(examId: string, participantId: string) {
      const blob = await downloadFile(
        `/exams/${examId}/print-card-participant/${participantId}`,
        `exam-participant-card-${participantId}.pdf`,
      );
      triggerBrowserDownload(blob, `exam-participant-card-${participantId}.pdf`);
    },
    async downloadExamReport(examId: string, format: string = "xlsx") {
      return downloadFile(`/exams/${examId}/report?format=${format}`, `exam-report-${examId}.${format}`);
    },
  };
}
