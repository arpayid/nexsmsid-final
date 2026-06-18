import type { ApiClientCore } from "../client";
import type {
  PeopleListOptions,
  PortalAccountCredentials,
  StudentRecord,
  GuardianRecord,
  TeacherRecord,
  StaffRecord,
  ImportResult,
} from "../types";

export function createPeopleApi({ request, downloadFile, uploadFile, triggerBrowserDownload }: ApiClientCore) {
  return {
    async listStudents(options: PeopleListOptions = {}) {
      const params = new URLSearchParams();

      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.classroomId) params.set("classroomId", options.classroomId);

      const query = params.toString();
      const response = await request<StudentRecord[]>(`/students${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getStudent(id: string) {
      const response = await request<StudentRecord>(`/students/${id}`);
      return response.data;
    },
    async createStudent(input: Record<string, unknown>) {
      const response = await request<StudentRecord>("/students", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async updateStudent(id: string, input: Record<string, unknown>) {
      const response = await request<StudentRecord>(`/students/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async deleteStudent(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/students/${id}`, {
        method: "DELETE",
      });
      return response.data;
    },
    async provisionStudentPortal(id: string, input: { email?: string; sendWelcomeEmail?: boolean } = {}) {
      const response = await request<PortalAccountCredentials>(`/students/${id}/provision-portal`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async resetStudentPortalPassword(id: string) {
      const response = await request<PortalAccountCredentials>(`/students/${id}/reset-portal-password`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      return response.data;
    },
    async listStudentGuardians(studentId: string) {
      const response = await request<Array<Record<string, unknown>>>(`/students/${studentId}/guardians`);
      return response.data;
    },
    async linkStudentGuardian(studentId: string, input: { guardianId: string; isPrimary?: boolean }) {
      const response = await request<Record<string, unknown>>(`/students/${studentId}/guardians`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async updateStudentGuardianLink(studentId: string, guardianId: string, input: { isPrimary: boolean }) {
      const response = await request<Record<string, unknown>>(`/students/${studentId}/guardians/${guardianId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async unlinkStudentGuardian(studentId: string, guardianId: string) {
      const response = await request<{ deleted: boolean }>(`/students/${studentId}/guardians/${guardianId}`, {
        method: "DELETE",
      });
      return response.data;
    },
    async listGuardians(options: PeopleListOptions = {}) {
      const params = new URLSearchParams();

      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);

      const query = params.toString();
      const response = await request<GuardianRecord[]>(`/guardians${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getGuardian(id: string) {
      const response = await request<GuardianRecord>(`/guardians/${id}`);
      return response.data;
    },
    async createGuardian(input: Record<string, unknown>) {
      const response = await request<GuardianRecord>("/guardians", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async updateGuardian(id: string, input: Record<string, unknown>) {
      const response = await request<GuardianRecord>(`/guardians/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async deleteGuardian(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/guardians/${id}`, {
        method: "DELETE",
      });
      return response.data;
    },
    async listTeachers(options: PeopleListOptions = {}) {
      const params = new URLSearchParams();

      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);

      const query = params.toString();
      const response = await request<TeacherRecord[]>(`/teachers${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getTeacher(id: string) {
      const response = await request<TeacherRecord>(`/teachers/${id}`);
      return response.data;
    },
    async createTeacher(input: Record<string, unknown>) {
      const response = await request<TeacherRecord>("/teachers", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async updateTeacher(id: string, input: Record<string, unknown>) {
      const response = await request<TeacherRecord>(`/teachers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async deleteTeacher(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/teachers/${id}`, {
        method: "DELETE",
      });
      return response.data;
    },
    async listStaffs(options: PeopleListOptions = {}) {
      const params = new URLSearchParams();

      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);

      const query = params.toString();
      const response = await request<StaffRecord[]>(`/staffs${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getStaff(id: string) {
      const response = await request<StaffRecord>(`/staffs/${id}`);
      return response.data;
    },
    async createStaff(input: Record<string, unknown>) {
      const response = await request<StaffRecord>("/staffs", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async updateStaff(id: string, input: Record<string, unknown>) {
      const response = await request<StaffRecord>(`/staffs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async deleteStaff(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/staffs/${id}`, {
        method: "DELETE",
      });
      return response.data;
    },

    // Phase 10.2 - Excel Import / Export / Template
    async downloadStudentsTemplate(): Promise<Blob> {
      return downloadFile("/students/template", "students-template.xlsx");
    },
    async exportStudents(): Promise<Blob> {
      return downloadFile("/students/export", "students-export.xlsx");
    },
    async importStudents(file: Blob | File) {
      return uploadFile<ImportResult>("/students/import", file);
    },
    async downloadGuardiansTemplate(): Promise<Blob> {
      return downloadFile("/guardians/template", "guardians-template.xlsx");
    },
    async exportGuardians(): Promise<Blob> {
      return downloadFile("/guardians/export", "guardians-export.xlsx");
    },
    async importGuardians(file: Blob | File) {
      return uploadFile<ImportResult>("/guardians/import", file);
    },
    async downloadTeachersTemplate(): Promise<Blob> {
      return downloadFile("/teachers/template", "teachers-template.xlsx");
    },
    async exportTeachers(): Promise<Blob> {
      return downloadFile("/teachers/export", "teachers-export.xlsx");
    },
    async importTeachers(file: Blob | File) {
      return uploadFile<ImportResult>("/teachers/import", file);
    },
    async downloadStaffsTemplate(): Promise<Blob> {
      return downloadFile("/staffs/template", "staffs-template.xlsx");
    },
    async exportStaffs(): Promise<Blob> {
      return downloadFile("/staffs/export", "staffs-export.xlsx");
    },
    async importStaffs(file: Blob | File) {
      return uploadFile<ImportResult>("/staffs/import", file);
    },
    async downloadSubjectsTemplate(): Promise<Blob> {
      return downloadFile("/subjects/template", "subjects-template.xlsx");
    },
    async exportSubjects(): Promise<Blob> {
      return downloadFile("/subjects/export", "subjects-export.xlsx");
    },
    async importSubjects(file: Blob | File) {
      return uploadFile<ImportResult>("/subjects/import", file);
    },
    async downloadClassroomsTemplate(): Promise<Blob> {
      return downloadFile("/classrooms/template", "classrooms-template.xlsx");
    },
    async exportClassrooms(): Promise<Blob> {
      return downloadFile("/classrooms/export", "classrooms-export.xlsx");
    },
    async importClassrooms(file: Blob | File) {
      return uploadFile<ImportResult>("/classrooms/import", file);
    },
    saveExcelBlob(blob: Blob, filename: string) {
      triggerBrowserDownload(blob, filename);
    },
  };
}
