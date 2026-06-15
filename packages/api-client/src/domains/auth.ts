import type { ApiClientCore } from "../client";
import type { AuthSession, AuthUser, LoginHistoryRecord } from "../types";

export function createAuthApi({ request }: ApiClientCore) {
  return {
    async login(input: { email: string; password: string }) {
      const response = await request<AuthSession>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async refresh(refreshToken?: string) {
      const response = await request<AuthSession>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });
      return response.data;
    },
    async logout(refreshToken?: string) {
      const response = await request<{ revokedRefreshTokens: number }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });
      return response.data;
    },
    async me() {
      const response = await request<AuthUser>("/auth/me");
      return response.data;
    },
    async changePassword(input: Record<string, unknown>) {
      const response = await request<{ success: boolean }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async logoutAll() {
      const response = await request<{ revokedRefreshTokens: number }>("/auth/logout-all", {
        method: "POST",
      });
      return response.data;
    },
    async getLoginHistory(options: { page?: number; limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<{
        items: LoginHistoryRecord[];
        total: number;
        page: number;
        limit: number;
      }>(`/auth/login-history${query ? `?${query}` : ""}`);
      return { items: response.data.items, meta: { total: response.data.total, page: response.data.page, limit: response.data.limit } };
    },
    async listSessions(options: { page?: number; limit?: number } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      const query = params.toString();
      const response = await request<{
        items: Array<{
          id: string;
          createdAt: string;
          expiresAt: string;
          ipAddress?: string | null;
          userAgent?: string | null;
        }>;
        total: number;
        page: number;
        limit: number;
      }>(`/auth/sessions${query ? `?${query}` : ""}`);
      return { items: response.data.items, meta: { total: response.data.total, page: response.data.page, limit: response.data.limit } };
    },
    async revokeSession(id: string) {
      const response = await request<{ id: string; revokedAt: string } | null>(`/auth/sessions/${id}`, { method: "DELETE" });
      return response.data;
    },
    async revokeAllSessions() {
      const response = await request<{ revokedCount: number }>(`/auth/sessions/revoke-all`, { method: "POST" });
      return response.data;
    },
  };
}
