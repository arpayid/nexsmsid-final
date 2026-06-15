import type { ApiClientCore } from "../client";
import type {
  IndustryPartnerRecord,
  InternshipRecord,
  InternshipLogRecord,
  AlumniRecord,
  JobVacancyRecord,
  JobApplicationRecord,
  TracerStudyRecord,
  BkkSummary,
} from "../types";

export function createBkkApi({ request, uploadFile, downloadFile }: ApiClientCore) {
  return {
    // Phase 9 - PKL, Alumni, BKK
    async listIndustryPartners(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<IndustryPartnerRecord[]>(`/industry-partners${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createIndustryPartner(input: Record<string, unknown>) {
      const response = await request<IndustryPartnerRecord>("/industry-partners", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateIndustryPartner(id: string, input: Record<string, unknown>) {
      const response = await request<IndustryPartnerRecord>(`/industry-partners/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteIndustryPartner(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/industry-partners/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listInternships(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<InternshipRecord[]>(`/internships${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createInternship(input: Record<string, unknown>) {
      const response = await request<InternshipRecord>("/internships", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateInternship(id: string, input: Record<string, unknown>) {
      const response = await request<InternshipRecord>(`/internships/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteInternship(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/internships/${id}`, { method: "DELETE" });
      return response.data;
    },
    async startInternship(id: string) {
      const response = await request<InternshipRecord>(`/internships/${id}/start`, { method: "POST" });
      return response.data;
    },
    async completeInternship(id: string) {
      const response = await request<InternshipRecord>(`/internships/${id}/complete`, { method: "POST" });
      return response.data;
    },
    async cancelInternship(id: string) {
      const response = await request<InternshipRecord>(`/internships/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async scoreInternship(id: string, input: Record<string, unknown>) {
      const response = await request<Record<string, unknown>>(`/internships/${id}/score`, { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async listInternshipLogs(internshipId: string, options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<InternshipLogRecord[]>(`/internships/${internshipId}/logs${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createInternshipLog(internshipId: string, input: Record<string, unknown>) {
      const response = await request<InternshipLogRecord>(`/internships/${internshipId}/logs`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async updateInternshipLog(id: string, input: Record<string, unknown>) {
      const response = await request<InternshipLogRecord>(`/internship-logs/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async approveInternshipLog(id: string) {
      const response = await request<InternshipLogRecord>(`/internship-logs/${id}/approve`, { method: "POST" });
      return response.data;
    },
    async rejectInternshipLog(id: string, input: Record<string, unknown>) {
      const response = await request<InternshipLogRecord>(`/internship-logs/${id}/reject`, { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async listAlumni(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<AlumniRecord[]>(`/alumni${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createAlumni(input: Record<string, unknown>) {
      const response = await request<AlumniRecord>("/alumni", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateAlumni(id: string, input: Record<string, unknown>) {
      const response = await request<AlumniRecord>(`/alumni/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteAlumni(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/alumni/${id}`, { method: "DELETE" });
      return response.data;
    },
    async convertAlumniFromStudent(studentId: string) {
      const response = await request<AlumniRecord>(`/alumni/convert-from-student/${studentId}`, { method: "POST" });
      return response.data;
    },
    async listJobVacancies(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<JobVacancyRecord[]>(`/job-vacancies${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createJobVacancy(input: Record<string, unknown>) {
      const response = await request<JobVacancyRecord>("/job-vacancies", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateJobVacancy(id: string, input: Record<string, unknown>) {
      const response = await request<JobVacancyRecord>(`/job-vacancies/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteJobVacancy(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/job-vacancies/${id}`, { method: "DELETE" });
      return response.data;
    },
    async publishJobVacancy(id: string) {
      const response = await request<JobVacancyRecord>(`/job-vacancies/${id}/publish`, { method: "POST" });
      return response.data;
    },
    async closeJobVacancy(id: string) {
      const response = await request<JobVacancyRecord>(`/job-vacancies/${id}/close`, { method: "POST" });
      return response.data;
    },
    async publicJobs(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      const response = await request<JobVacancyRecord[]>(`/public/jobs${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async publicJob(id: string) {
      const response = await request<JobVacancyRecord>(`/public/jobs/${id}`);
      return response.data;
    },
    async issuePublicJobCvUploadToken(jobId: string, captchaToken?: string) {
      const response = await request<{ uploadToken: string }>(`/public/jobs/${jobId}/upload-cv-token`, {
        method: "POST",
        body: JSON.stringify(captchaToken ? { captchaToken } : {}),
      });
      return response.data;
    },
    async uploadPublicJobCv(file: File, uploadToken: string, captchaToken?: string) {
      return uploadFile<{ cvUrl: string }>("/public/jobs/upload-cv", file, "file", file.name, {
        uploadToken,
        ...(captchaToken ? { captchaToken } : {}),
      });
    },
    async publicApplyJob(id: string, input: Record<string, unknown>) {
      const response = await request<JobApplicationRecord>(`/public/jobs/${id}/apply`, { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async listJobApplications(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<JobApplicationRecord[]>(`/job-applications${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async downloadJobApplicationCv(id: string, fallbackFilename = "cv.pdf") {
      return downloadFile(`/job-applications/${id}/cv`, fallbackFilename);
    },
    async updateJobApplication(id: string, input: Record<string, unknown>) {
      const response = await request<JobApplicationRecord>(`/job-applications/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async reviewJobApplication(id: string) {
      const response = await request<JobApplicationRecord>(`/job-applications/${id}/review`, { method: "POST" });
      return response.data;
    },
    async acceptJobApplication(id: string, input: Record<string, unknown> = {}) {
      const response = await request<JobApplicationRecord>(`/job-applications/${id}/accept`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async rejectJobApplication(id: string, input: Record<string, unknown> = {}) {
      const response = await request<JobApplicationRecord>(`/job-applications/${id}/reject`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async listTracerStudies(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<TracerStudyRecord[]>(`/tracer-studies${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createTracerStudy(input: Record<string, unknown>) {
      const response = await request<TracerStudyRecord>("/tracer-studies", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateTracerStudy(id: string, input: Record<string, unknown>) {
      const response = await request<TracerStudyRecord>(`/tracer-studies/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteTracerStudy(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/tracer-studies/${id}`, { method: "DELETE" });
      return response.data;
    },
    async getBkkSummary() {
      const response = await request<BkkSummary>("/bkk/summary");
      return response.data;
    },
    async getBkkJobStatusChart() {
      const response = await request<Array<Record<string, unknown>>>("/bkk/job-status-chart");
      return response.data;
    },
    async getBkkAlumniStatusChart() {
      const response = await request<Array<Record<string, unknown>>>("/bkk/alumni-status-chart");
      return response.data;
    },
  };
}
