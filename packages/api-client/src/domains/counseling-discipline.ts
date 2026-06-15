import type { ApiClientCore } from "../client";
import type {
  CounselingCaseRecord,
  CounselingNoteRecord,
  DisciplineRuleRecord,
  DisciplineViolationRecord,
  StudentAchievementRecord,
  DisciplineSummaryRecord,
} from "../types";

export function createCounselingDisciplineApi({ request, downloadFile }: ApiClientCore) {
  return {
    // Phase 12.1 - Counseling and Discipline
    async listCounselingCases(
      options: {
        page?: number;
        limit?: number;
        search?: string;
        studentId?: string;
        status?: string;
        priority?: string;
        category?: string;
        counselorId?: string;
        startDate?: string;
        endDate?: string;
      } = {},
    ) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.studentId) params.set("studentId", options.studentId);
      if (options.status) params.set("status", options.status);
      if (options.priority) params.set("priority", options.priority);
      if (options.category) params.set("category", options.category);
      if (options.counselorId) params.set("counselorId", options.counselorId);
      if (options.startDate) params.set("startDate", options.startDate);
      if (options.endDate) params.set("endDate", options.endDate);
      const query = params.toString();
      const response = await request<CounselingCaseRecord[]>(`/counseling/cases${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createCounselingCase(input: Record<string, unknown>) {
      const response = await request<CounselingCaseRecord>("/counseling/cases", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async getCounselingCase(id: string) {
      const response = await request<CounselingCaseRecord>(`/counseling/cases/${id}`);
      return response.data;
    },
    async updateCounselingCase(id: string, input: Record<string, unknown>) {
      const response = await request<CounselingCaseRecord>(`/counseling/cases/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteCounselingCase(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/counseling/cases/${id}`, { method: "DELETE" });
      return response.data;
    },
    async closeCounselingCase(id: string, input: Record<string, unknown> = {}) {
      const response = await request<CounselingCaseRecord>(`/counseling/cases/${id}/close`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async reopenCounselingCase(id: string) {
      const response = await request<CounselingCaseRecord>(`/counseling/cases/${id}/reopen`, { method: "POST" });
      return response.data;
    },
    async listCounselingNotes(caseId: string) {
      const response = await request<CounselingNoteRecord[]>(`/counseling/cases/${caseId}/notes`);
      return response.data;
    },
    async createCounselingNote(caseId: string, input: Record<string, unknown>) {
      const response = await request<CounselingNoteRecord>(`/counseling/cases/${caseId}/notes`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async listDisciplineRules(options: { page?: number; limit?: number; search?: string; severity?: string; isActive?: boolean } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.severity) params.set("severity", options.severity);
      if (options.isActive !== undefined) params.set("isActive", String(options.isActive));
      const query = params.toString();
      const response = await request<DisciplineRuleRecord[]>(`/discipline/rules${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createDisciplineRule(input: Record<string, unknown>) {
      const response = await request<DisciplineRuleRecord>("/discipline/rules", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateDisciplineRule(id: string, input: Record<string, unknown>) {
      const response = await request<DisciplineRuleRecord>(`/discipline/rules/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteDisciplineRule(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/discipline/rules/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listDisciplineViolations(
      options: {
        page?: number;
        limit?: number;
        search?: string;
        studentId?: string;
        classroomId?: string;
        ruleId?: string;
        status?: string;
        severity?: string;
        startDate?: string;
        endDate?: string;
      } = {},
    ) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.studentId) params.set("studentId", options.studentId);
      if (options.classroomId) params.set("classroomId", options.classroomId);
      if (options.ruleId) params.set("ruleId", options.ruleId);
      if (options.status) params.set("status", options.status);
      if (options.severity) params.set("severity", options.severity);
      if (options.startDate) params.set("startDate", options.startDate);
      if (options.endDate) params.set("endDate", options.endDate);
      const query = params.toString();
      const response = await request<DisciplineViolationRecord[]>(`/discipline/violations${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createDisciplineViolation(input: Record<string, unknown>) {
      const response = await request<DisciplineViolationRecord>("/discipline/violations", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async getDisciplineViolation(id: string) {
      const response = await request<DisciplineViolationRecord>(`/discipline/violations/${id}`);
      return response.data;
    },
    async updateDisciplineViolation(id: string, input: Record<string, unknown>) {
      const response = await request<DisciplineViolationRecord>(`/discipline/violations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async confirmDisciplineViolation(id: string) {
      const response = await request<DisciplineViolationRecord>(`/discipline/violations/${id}/confirm`, { method: "POST" });
      return response.data;
    },
    async cancelDisciplineViolation(id: string) {
      const response = await request<DisciplineViolationRecord>(`/discipline/violations/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async deleteDisciplineViolation(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/discipline/violations/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listStudentAchievements(
      options: {
        page?: number;
        limit?: number;
        search?: string;
        studentId?: string;
        classroomId?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
      } = {},
    ) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.studentId) params.set("studentId", options.studentId);
      if (options.classroomId) params.set("classroomId", options.classroomId);
      if (options.category) params.set("category", options.category);
      if (options.startDate) params.set("startDate", options.startDate);
      if (options.endDate) params.set("endDate", options.endDate);
      const query = params.toString();
      const response = await request<StudentAchievementRecord[]>(`/discipline/achievements${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createStudentAchievement(input: Record<string, unknown>) {
      const response = await request<StudentAchievementRecord>("/discipline/achievements", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateStudentAchievement(id: string, input: Record<string, unknown>) {
      const response = await request<StudentAchievementRecord>(`/discipline/achievements/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async deleteStudentAchievement(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/discipline/achievements/${id}`, { method: "DELETE" });
      return response.data;
    },
    async getStudentDisciplineSummary(studentId: string) {
      const response = await request<DisciplineSummaryRecord>(`/discipline/students/${studentId}/summary`);
      return response.data;
    },
    async getClassroomDisciplineSummary(classroomId: string) {
      const response = await request<DisciplineSummaryRecord>(`/discipline/classrooms/${classroomId}/summary`);
      return response.data;
    },
    async downloadDisciplineViolationPdf(id: string): Promise<Blob> {
      return downloadFile(`/discipline/violations/${id}/print`, `discipline-violation-${id}.pdf`);
    },
    async downloadStudentDisciplineSummaryPdf(studentId: string): Promise<Blob> {
      return downloadFile(`/discipline/students/${studentId}/summary.pdf`, `discipline-summary-${studentId}.pdf`);
    },
  };
}
