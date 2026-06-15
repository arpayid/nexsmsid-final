import type { ApiClientCore } from "../client";
import type { LetterTemplateRecord, LetterRecord, LetterSummaryRecord } from "../types";

export function createLettersApi({ request, downloadFile, uploadFile }: ApiClientCore) {
  return {
    // Phase 12.2 - Letter Management
    async listLetterTemplates(options: { page?: number; limit?: number; search?: string; category?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.category) params.set("category", options.category);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<LetterTemplateRecord[]>(`/letters/templates${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createLetterTemplate(input: Record<string, unknown>) {
      const response = await request<LetterTemplateRecord>("/letters/templates", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async getLetterTemplate(id: string) {
      const response = await request<LetterTemplateRecord>(`/letters/templates/${id}`);
      return response.data;
    },
    async updateLetterTemplate(id: string, input: Record<string, unknown>) {
      const response = await request<LetterTemplateRecord>(`/letters/templates/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteLetterTemplate(id: string) {
      const response = await request<{ deleted: boolean; item: LetterTemplateRecord }>(`/letters/templates/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listLetters(
      options: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        direction?: string;
        priority?: string;
        category?: string;
        recipientType?: string;
        studentId?: string;
        guardianId?: string;
        teacherId?: string;
        staffId?: string;
        createdById?: string;
        startDate?: string;
        endDate?: string;
      } = {},
    ) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.direction) params.set("direction", options.direction);
      if (options.priority) params.set("priority", options.priority);
      if (options.category) params.set("category", options.category);
      if (options.recipientType) params.set("recipientType", options.recipientType);
      if (options.studentId) params.set("studentId", options.studentId);
      if (options.guardianId) params.set("guardianId", options.guardianId);
      if (options.teacherId) params.set("teacherId", options.teacherId);
      if (options.staffId) params.set("staffId", options.staffId);
      if (options.createdById) params.set("createdById", options.createdById);
      if (options.startDate) params.set("startDate", options.startDate);
      if (options.endDate) params.set("endDate", options.endDate);
      const query = params.toString();
      const response = await request<LetterRecord[]>(`/letters${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createLetter(input: Record<string, unknown>) {
      const response = await request<LetterRecord>("/letters", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async getLetter(id: string) {
      const response = await request<LetterRecord>(`/letters/${id}`);
      return response.data;
    },
    async updateLetter(id: string, input: Record<string, unknown>) {
      const response = await request<LetterRecord>(`/letters/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteLetter(id: string) {
      const response = await request<{ deleted: boolean; item: LetterRecord }>(`/letters/${id}`, { method: "DELETE" });
      return response.data;
    },
    async submitLetter(id: string) {
      const response = await request<LetterRecord>(`/letters/${id}/submit`, { method: "POST" });
      return response.data;
    },
    async approveLetter(id: string) {
      const response = await request<LetterRecord>(`/letters/${id}/approve`, { method: "POST" });
      return response.data;
    },
    async rejectLetter(id: string, input: Record<string, unknown>) {
      const response = await request<LetterRecord>(`/letters/${id}/reject`, { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async issueLetter(id: string) {
      const response = await request<LetterRecord>(`/letters/${id}/issue`, { method: "POST" });
      return response.data;
    },
    async archiveLetter(id: string) {
      const response = await request<LetterRecord>(`/letters/${id}/archive`, { method: "POST" });
      return response.data;
    },
    async cancelLetter(id: string) {
      const response = await request<LetterRecord>(`/letters/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async reopenLetter(id: string) {
      const response = await request<LetterRecord>(`/letters/${id}/reopen`, { method: "POST" });
      return response.data;
    },
    async generateLetterNumber(id: string) {
      const response = await request<LetterRecord>(`/letters/${id}/generate-number`, { method: "POST" });
      return response.data;
    },
    async getLetterNumberPreview(options: { category: string; date?: string }) {
      const params = new URLSearchParams();
      if (options.category) params.set("category", options.category);
      if (options.date) params.set("date", options.date);
      const query = params.toString();
      const response = await request<Record<string, unknown>>(`/letters/number-preview${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getLetterSummary() {
      const response = await request<LetterSummaryRecord>("/letters/summary");
      return response.data;
    },
    async downloadLetterPdf(id: string): Promise<Blob> {
      return downloadFile(`/letters/${id}/pdf`, `letter-${id}.pdf`);
    },
    async uploadLetterAttachment(letterId: string, file: Blob | File) {
      return uploadFile(`/letters/${letterId}/attachments`, file, "file", `attachment-${letterId}`);
    },
    async downloadLetterAttachment(letterId: string, attachmentId: string, filename?: string): Promise<Blob> {
      return downloadFile(`/letters/${letterId}/attachments/${attachmentId}/file`, filename ?? `attachment-${attachmentId}`);
    },
  };
}
