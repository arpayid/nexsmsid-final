import type { ApiClientCore } from "../client";
import type { ReportDefinitionRecord, ReportJobRecord, ExportHistoryRecord, ReportCenterSummary } from "../types";

export function createReportsApi({ request, downloadFile }: ApiClientCore) {
  return {
    // Reports
    async listReportTypes() {
      const response = await request<ReportDefinitionRecord[]>("/reports/types");
      return response.data;
    },
    async getReportSummary() {
      const response = await request<ReportCenterSummary>("/reports/summary");
      return response.data;
    },
    async generateReport(input: Record<string, unknown>) {
      const response = await request<ReportJobRecord>("/reports/generate", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async downloadReport(reportJobId: string): Promise<Blob> {
      return downloadFile(`/reports/download/${reportJobId}`, `report-${reportJobId}.xlsx`);
    },
    async listReportJobs(options: { page?: number; limit?: number; search?: string; status?: string; type?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.type) params.set("type", options.type);
      const query = params.toString();
      const response = await request<ReportJobRecord[]>(`/report-jobs${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createReportJob(input: Record<string, unknown>) {
      const response = await request<ReportJobRecord>("/report-jobs", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async cancelReportJob(id: string) {
      const response = await request<ReportJobRecord>(`/report-jobs/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async listExportHistory(options: { page?: number; limit?: number; search?: string; entity?: string; format?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.entity) params.set("entity", options.entity);
      if (options.format) params.set("format", options.format);
      const query = params.toString();
      const response = await request<ExportHistoryRecord[]>(`/export-history${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    savePdfBlob(blob: Blob, filename: string) {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
}
