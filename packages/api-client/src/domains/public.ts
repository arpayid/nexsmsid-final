import type { ApiClientCore } from "../client";
import type { AnnouncementRecord, SchoolProfile } from "../types";

export type PublicCompetency = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  department: { id: string; code: string; name: string; description: string | null };
};

export type PublicPartner = {
  id: string;
  name: string;
  type: string | null;
  website: string | null;
  address: string | null;
};

export type PublicPpdbOverview = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  quota: number | null;
  academicYear: { id: string; name: string } | null;
  registeredCount: number;
  fillPercent: number | null;
};

export type PublicSchoolStats = {
  activeStudents: number;
  totalTeachers: number;
  totalPrograms: number;
  totalPartners: number;
};

export type PpdbStatusResult = {
  registrationNumber: string;
  name: string;
  status: string;
  selectionStatus: string;
  periodName: string;
  departmentName?: string | null;
  competencyName?: string | null;
  createdAt?: string;
  uploadToken?: string;
  requiresPinSetup?: boolean;
  message?: string;
  documents?: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
};

export function createPublicApi({ request, uploadFile, downloadFile }: ApiClientCore) {
  return {
    async publicSchoolStats() {
      const response = await request<PublicSchoolStats>("/public/school-stats");
      return response.data;
    },
    async publicSchoolProfile() {
      const response = await request<SchoolProfile>("/public/school-profile");
      return response.data;
    },
    async publicCompetencies() {
      const response = await request<PublicCompetency[]>("/public/competencies");
      return response.data;
    },
    async publicPartners() {
      const response = await request<PublicPartner[]>("/public/partners");
      return response.data;
    },
    async publicPpdbOverview() {
      const response = await request<PublicPpdbOverview | null>("/public/ppdb/overview");
      return response.data;
    },
    async checkPpdbStatus(input: { registrationNumber: string; phone: string; pin?: string; captchaToken?: string }) {
      const response = await request<PpdbStatusResult>("/public/ppdb/check-status", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async setPublicPpdbPin(input: { registrationNumber: string; phone: string; pin: string; captchaToken?: string }) {
      const response = await request<{ registrationNumber: string; message: string }>("/public/ppdb/set-pin", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async uploadPublicPpdbFile(file: File, uploadToken: string, captchaToken?: string) {
      return uploadFile<{ fileKey: string }>("/public/ppdb/upload", file, "file", file.name, {
        uploadToken,
        ...(captchaToken ? { captchaToken } : {}),
      });
    },
    async submitPublicPpdbDocument(input: {
      registrationNumber: string;
      phone: string;
      name: string;
      fileKey: string;
      uploadToken: string;
      captchaToken?: string;
    }) {
      const response = await request<{ id: string; name: string; fileUrl: string }>("/public/ppdb/documents", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async downloadPublicPpdbDocument(documentId: string, uploadToken: string, fallbackFilename = "document.pdf") {
      const query = new URLSearchParams({ uploadToken });
      return downloadFile(`/public/ppdb/documents/${documentId}/file?${query.toString()}`, fallbackFilename);
    },
    async publicAnnouncements(options: { page?: number; limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<AnnouncementRecord[]>(`/public/announcements${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async publicAnnouncement(id: string) {
      const response = await request<AnnouncementRecord>(`/public/announcements/${id}`);
      return response.data;
    },
  };
}
