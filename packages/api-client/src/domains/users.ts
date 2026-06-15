import type { ApiClientCore } from "../client";
import type { UserSummary, RoleSummary, PermissionSummary } from "../types";
import type { DashboardSummary, DashboardRoleSummary, DashboardRecentActivity, DashboardSystemStatus } from "../types";

export function createUsersApi({ request }: ApiClientCore) {
  return {
    async users() {
      return request<UserSummary[]>("/users");
    },
    async resetUserPassword(id: string, input: Record<string, unknown>) {
      const response = await request<{ success: boolean }>(`/users/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async unlockUser(id: string) {
      const response = await request<{ success: boolean }>(`/users/${id}/unlock`, {
        method: "POST",
      });
      return response.data;
    },
    async forceChangePassword(id: string, input: Record<string, unknown>) {
      const response = await request<{ success: boolean }>(`/users/${id}/force-change-password`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async roles() {
      return request<RoleSummary[]>("/roles");
    },
    async permissions() {
      return request<PermissionSummary[]>("/permissions");
    },
    async dashboardSummary() {
      const response = await request<DashboardSummary>("/dashboard/summary");
      return response.data;
    },
    async dashboardUserRoleSummary() {
      const response = await request<DashboardRoleSummary[]>("/dashboard/user-role-summary");
      return response.data;
    },
    async dashboardRecentActivities() {
      const response = await request<DashboardRecentActivity[]>("/dashboard/recent-activities");
      return response.data;
    },
    async dashboardSystemStatus() {
      const response = await request<DashboardSystemStatus>("/dashboard/system-status");
      return response.data;
    },
    async dashboardOverview() {
      const response = await request<unknown>("/dashboard/overview");
      return response.data;
    },
    async dashboardAcademicSummary() {
      const response = await request<unknown>("/dashboard/academic-summary");
      return response.data;
    },
    async dashboardFinanceSummary() {
      const response = await request<unknown>("/dashboard/finance-summary");
      return response.data;
    },
    async dashboardPpdbSummary() {
      const response = await request<unknown>("/dashboard/ppdb-summary");
      return response.data;
    },
    async dashboardPeopleSummary() {
      const response = await request<unknown>("/dashboard/people-summary");
      return response.data;
    },
    async dashboardActivityFeed() {
      const response = await request<unknown[]>("/dashboard/activity-feed");
      return response.data;
    },
    async dashboardQuickAlerts() {
      const response = await request<unknown>("/dashboard/quick-alerts");
      return response.data;
    },
  };
}
