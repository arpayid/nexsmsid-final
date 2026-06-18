import type { ApiClientCore } from "../client";
import type { PpdbConvertResult, PpdbPeriodRecord, PpdbRegistrationRecord } from "../types";

export function createPpdbApi({ request, downloadFile }: ApiClientCore) {
  return {
    // Phase 8 - PPDB
    async listPpdbPeriods(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      const response = await request<PpdbPeriodRecord[]>(`/ppdb/periods${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getPpdbPeriod(id: string) {
      const response = await request<PpdbPeriodRecord>(`/ppdb/periods/${id}`);
      return response.data;
    },
    async createPpdbPeriod(input: Record<string, unknown>) {
      const response = await request<PpdbPeriodRecord>("/ppdb/periods", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updatePpdbPeriod(id: string, input: Record<string, unknown>) {
      const response = await request<PpdbPeriodRecord>(`/ppdb/periods/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deletePpdbPeriod(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/ppdb/periods/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listPpdbRegistrations(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      const response = await request<PpdbRegistrationRecord[]>(`/ppdb/registrations${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getPpdbRegistration(id: string) {
      const response = await request<PpdbRegistrationRecord>(`/ppdb/registrations/${id}`);
      return response.data;
    },
    async updatePpdbRegistration(id: string, input: Record<string, unknown>) {
      const response = await request<PpdbRegistrationRecord>(`/ppdb/registrations/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async verifyPpdbRegistration(id: string) {
      const response = await request<PpdbRegistrationRecord>(`/ppdb/registrations/${id}/verify`, { method: "POST" });
      return response.data;
    },
    async acceptPpdbRegistration(id: string, input: Record<string, unknown> = {}) {
      const response = await request<PpdbRegistrationRecord>(`/ppdb/registrations/${id}/accept`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async rejectPpdbRegistration(id: string, input: Record<string, unknown>) {
      const response = await request<PpdbRegistrationRecord>(`/ppdb/registrations/${id}/reject`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async convertPpdbRegistration(
      id: string,
      input: {
        email?: string;
        provisionPortalAccount?: boolean;
        sendWelcomeEmail?: boolean;
      } = {},
    ) {
      const response = await request<PpdbConvertResult>(`/ppdb/registrations/${id}/convert-to-student`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async getPpdbSummary() {
      const response = await request<Record<string, unknown>>("/ppdb/summary");
      return response.data;
    },
    async getActivePpdbPeriod() {
      const response = await request<PpdbPeriodRecord>("/public/ppdb/active-period");
      return response.data;
    },
    async publicPpdbRegister(input: Record<string, unknown>) {
      const response = await request<PpdbRegistrationRecord>("/public/ppdb/register", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async downloadPpdbProofPdf(id: string): Promise<Blob> {
      return downloadFile(`/ppdb/registrations/${id}/proof.pdf`, `ppdb-${id}.pdf`);
    },
    async verifyPpdbDocument(documentId: string) {
      const response = await request<Record<string, unknown>>(`/ppdb/documents/${documentId}/verify`, { method: "POST" });
      return response.data;
    },
    async rejectPpdbDocument(documentId: string, input: { note?: string } = {}) {
      const response = await request<Record<string, unknown>>(`/ppdb/documents/${documentId}/reject`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async downloadPpdbDocumentFile(documentId: string, fallbackFilename = "document.pdf") {
      return downloadFile(`/ppdb/documents/${documentId}/file`, fallbackFilename);
    },
  };
}
