import type { ApiClientCore } from "../client";
import type {
  TeachingAssignmentRecord,
  ScheduleRecord,
  AttendanceSessionRecord,
  AttendanceSessionDetail,
  AttendanceClassroomSummary,
  AttendanceStudentSummary,
  AttendanceRecordRecord,
  AssessmentRecord,
  AssessmentDetail,
  GradeRecord,
  GradesClassroomSummary,
  GradesStudentSummary,
  StudentDisciplinePortalSummary,
} from "../types";

export function createAcademicApi({ request, downloadFile }: ApiClientCore) {
  return {
    // Phase 7 - Teaching Assignments
    async listTeachingAssignments(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      return request<TeachingAssignmentRecord[]>(`/teaching-assignments${query ? `?${query}` : ""}`);
    },
    async getTeachingAssignment(id: string) {
      const response = await request<TeachingAssignmentRecord>(`/teaching-assignments/${id}`);
      return response.data;
    },
    async createTeachingAssignment(input: Record<string, unknown>) {
      const response = await request<TeachingAssignmentRecord>("/teaching-assignments", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateTeachingAssignment(id: string, input: Record<string, unknown>) {
      const response = await request<TeachingAssignmentRecord>(`/teaching-assignments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async deleteTeachingAssignment(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/teaching-assignments/${id}`, { method: "DELETE" });
      return response.data;
    },

    // Phase 7 - Schedules
    async listSchedules(options: { page?: number; limit?: number; search?: string; classroomId?: string; teacherId?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.classroomId) params.set("classroomId", options.classroomId);
      if (options.teacherId) params.set("teacherId", options.teacherId);
      const query = params.toString();
      return request<ScheduleRecord[]>(`/schedules${query ? `?${query}` : ""}`);
    },
    async getSchedule(id: string) {
      const response = await request<ScheduleRecord>(`/schedules/${id}`);
      return response.data;
    },
    async createSchedule(input: Record<string, unknown>) {
      const response = await request<ScheduleRecord>("/schedules", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateSchedule(id: string, input: Record<string, unknown>) {
      const response = await request<ScheduleRecord>(`/schedules/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteSchedule(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/schedules/${id}`, { method: "DELETE" });
      return response.data;
    },

    // Phase 7 - Attendance
    async listAttendanceSessions(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      const response = await request<AttendanceSessionRecord[]>(`/attendance/sessions${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createAttendanceSession(input: Record<string, unknown>) {
      const response = await request<AttendanceSessionRecord>("/attendance/sessions", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateAttendanceSession(id: string, input: Record<string, unknown>) {
      const response = await request<AttendanceSessionRecord>(`/attendance/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async recordAttendance(sessionId: string, input: { records: Array<{ studentId: string; status: string; note?: string }> }) {
      const response = await request<AttendanceRecordRecord[]>(`/attendance/sessions/${sessionId}/records`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async getAttendanceSession(id: string) {
      const response = await request<AttendanceSessionDetail>(`/attendance/sessions/${id}`);
      return response.data;
    },
    async getAttendanceByClassroom(classroomId: string) {
      const response = await request<AttendanceClassroomSummary>(`/attendance/classrooms/${classroomId}/summary`);
      return response.data;
    },
    async getAttendanceByStudent(studentId: string) {
      const response = await request<AttendanceStudentSummary>(`/attendance/students/${studentId}/summary`);
      return response.data;
    },

    // Phase 7 - Grades
    async listAssessments(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      const response = await request<AssessmentRecord[]>(`/grades/assessments${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createAssessment(input: Record<string, unknown>) {
      const response = await request<AssessmentRecord>("/grades/assessments", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateAssessment(id: string, input: Record<string, unknown>) {
      const response = await request<AssessmentRecord>(`/grades/assessments/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async getAssessmentDetail(id: string) {
      const response = await request<AssessmentDetail>(`/grades/assessments/${id}`);
      return response.data;
    },
    async inputScores(assessmentId: string, input: { scores: Array<{ studentId: string; score: number; notes?: string }> }) {
      const response = await request<GradeRecord[]>(`/grades/assessments/${assessmentId}/scores`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async approveScores(assessmentId: string) {
      const response = await request<{ approved: number }>(`/grades/assessments/${assessmentId}/approve`, { method: "POST" });
      return response.data;
    },
    async getGradesByClassroom(classroomId: string) {
      const response = await request<GradesClassroomSummary>(`/grades/classrooms/${classroomId}/summary`);
      return response.data;
    },
    async getGradesByStudent(studentId: string) {
      const response = await request<GradesStudentSummary>(`/grades/students/${studentId}/summary`);
      return response.data;
    },

    // PDF Downloads
    async downloadAttendanceRecapPdf(classroomId: string, input: { startDate: string; endDate: string }): Promise<Blob> {
      const params = new URLSearchParams();
      params.set("startDate", input.startDate);
      params.set("endDate", input.endDate);
      return downloadFile(`/attendance/classrooms/${classroomId}/recap.pdf?${params.toString()}`, `attendance-recap-${classroomId}.pdf`);
    },
    async downloadGradeRecapPdf(classroomId: string, input: { semesterId?: string } = {}): Promise<Blob> {
      const params = new URLSearchParams();
      if (input.semesterId) params.set("semesterId", input.semesterId);
      const query = params.toString();
      return downloadFile(`/grades/classrooms/${classroomId}/recap.pdf${query ? `?${query}` : ""}`, `grade-recap-${classroomId}.pdf`);
    },

    // Phase 10.4 - Role-based Portals
    async getTeacherPortalSummary() {
      const response = await request<unknown>("/teacher-portal/summary");
      return response.data;
    },
    async getTeacherPortalTeachingAssignments() {
      const response = await request<unknown[]>("/teacher-portal/teaching-assignments");
      return response.data;
    },
    async getTeacherPortalSchedules() {
      const response = await request<unknown[]>("/teacher-portal/schedules");
      return response.data;
    },
    async getTeacherPortalAttendanceSessions(options: { limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<unknown[]>(`/teacher-portal/attendance-sessions${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getTeacherPortalAssessments() {
      const response = await request<unknown[]>("/teacher-portal/assessments");
      return response.data;
    },
    async getTeacherPortalNotifications(options: { limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<unknown[]>(`/teacher-portal/notifications${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getTeacherPortalDashboard() {
      const response = await request<unknown>("/teacher-portal/dashboard");
      return response.data;
    },
    async getTeacherPortalTodaySchedules() {
      const response = await request<unknown[]>("/teacher-portal/today-schedules");
      return response.data;
    },
    async getTeacherPortalPendingAttendance() {
      const response = await request<unknown[]>("/teacher-portal/pending-attendance");
      return response.data;
    },
    async getTeacherPortalPendingGrades() {
      const response = await request<unknown[]>("/teacher-portal/pending-grades");
      return response.data;
    },
    async getTeacherPortalRecentNotifications() {
      const response = await request<unknown[]>("/teacher-portal/recent-notifications");
      return response.data;
    },

    async getStudentPortalSummary() {
      const response = await request<unknown>("/student-portal/summary");
      return response.data;
    },
    async getStudentPortalProfile() {
      const response = await request<unknown>("/student-portal/profile");
      return response.data;
    },
    async getStudentPortalSchedules() {
      const response = await request<unknown[]>("/student-portal/schedules");
      return response.data;
    },
    async getStudentPortalAttendance(options: { limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<unknown>(`/student-portal/attendance${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getStudentPortalGrades() {
      const response = await request<unknown[]>("/student-portal/grades");
      return response.data;
    },
    async getStudentPortalInvoices() {
      const response = await request<unknown[]>("/student-portal/invoices");
      return response.data;
    },
    async getStudentPortalDiscipline() {
      const response = await request<StudentDisciplinePortalSummary>("/student-portal/discipline");
      return response.data;
    },
    async getStudentPortalAnnouncements(options: { limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<unknown[]>(`/student-portal/announcements${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getStudentPortalNotifications(options: { limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<unknown[]>(`/student-portal/notifications${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getStudentPortalDashboard() {
      const response = await request<unknown>("/student-portal/dashboard");
      return response.data;
    },
    async getStudentPortalTodaySchedules() {
      const response = await request<unknown[]>("/student-portal/today-schedules");
      return response.data;
    },
    async getStudentPortalAttendanceSummary() {
      const response = await request<unknown>("/student-portal/attendance-summary");
      return response.data;
    },
    async getStudentPortalGradeSummary() {
      const response = await request<unknown>("/student-portal/grade-summary");
      return response.data;
    },
    async getStudentPortalInvoiceSummary() {
      const response = await request<unknown>("/student-portal/invoice-summary");
      return response.data;
    },
    async getStudentPortalRecentAnnouncements() {
      const response = await request<unknown[]>("/student-portal/recent-announcements");
      return response.data;
    },

    async getGuardianPortalSummary() {
      const response = await request<unknown>("/guardian-portal/summary");
      return response.data;
    },
    async getGuardianPortalChildren() {
      const response = await request<unknown[]>("/guardian-portal/children");
      return response.data;
    },
    async getGuardianPortalChildAttendance(studentId: string, options: { limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<unknown>(`/guardian-portal/children/${studentId}/attendance${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getGuardianPortalChildGrades(studentId: string) {
      const response = await request<unknown[]>(`/guardian-portal/children/${studentId}/grades`);
      return response.data;
    },
    async getGuardianPortalChildInvoices(studentId: string) {
      const response = await request<unknown[]>(`/guardian-portal/children/${studentId}/invoices`);
      return response.data;
    },
    async getGuardianPortalChildDiscipline(studentId: string) {
      const response = await request<StudentDisciplinePortalSummary>(`/guardian-portal/children/${studentId}/discipline`);
      return response.data;
    },
    async getGuardianPortalAnnouncements(options: { limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<unknown[]>(`/guardian-portal/announcements${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getGuardianPortalNotifications(options: { limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<unknown[]>(`/guardian-portal/notifications${query ? `?${query}` : ""}`);
      return response.data;
    },
    async getGuardianPortalDashboard() {
      const response = await request<unknown>("/guardian-portal/dashboard");
      return response.data;
    },
    async getGuardianPortalChildDashboard(studentId: string) {
      const response = await request<unknown>(`/guardian-portal/children/${studentId}/dashboard`);
      return response.data;
    },
    async getGuardianPortalChildAttendanceSummary(studentId: string) {
      const response = await request<unknown>(`/guardian-portal/children/${studentId}/attendance-summary`);
      return response.data;
    },
    async getGuardianPortalChildGradeSummary(studentId: string) {
      const response = await request<unknown>(`/guardian-portal/children/${studentId}/grade-summary`);
      return response.data;
    },
    async getGuardianPortalChildInvoiceSummary(studentId: string) {
      const response = await request<unknown>(`/guardian-portal/children/${studentId}/invoice-summary`);
      return response.data;
    },
    async getGuardianPortalRecentAnnouncements() {
      const response = await request<unknown[]>("/guardian-portal/recent-announcements");
      return response.data;
    },
  };
}
