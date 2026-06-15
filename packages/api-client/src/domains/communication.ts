import type { ApiClientCore } from "../client";
import type { AnnouncementRecord, InternalMessageRecord, NotificationRecord, NotificationTemplateRecord } from "../types";

export function createCommunicationApi({ request }: ApiClientCore) {
  return {
    // Phase 10 - Communication, Notifications
    async listAnnouncements(options: { page?: number; limit?: number; search?: string; status?: string; audience?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.audience) params.set("audience", options.audience);
      const query = params.toString();
      const response = await request<AnnouncementRecord[]>(`/announcements${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createAnnouncement(input: Record<string, unknown>) {
      const response = await request<AnnouncementRecord>("/announcements", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateAnnouncement(id: string, input: Record<string, unknown>) {
      const response = await request<AnnouncementRecord>(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteAnnouncement(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/announcements/${id}`, { method: "DELETE" });
      return response.data;
    },
    async publishAnnouncement(id: string) {
      const response = await request<AnnouncementRecord>(`/announcements/${id}/publish`, { method: "POST" });
      return response.data;
    },
    async archiveAnnouncement(id: string) {
      const response = await request<AnnouncementRecord>(`/announcements/${id}/archive`, { method: "POST" });
      return response.data;
    },
    async publicAnnouncements(options: { page?: number; limit?: number; search?: string; audience?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.audience) params.set("audience", options.audience);
      const query = params.toString();
      const response = await request<AnnouncementRecord[]>(`/public/announcements${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async publicAnnouncement(id: string) {
      const response = await request<AnnouncementRecord>(`/public/announcements/${id}`);
      return response.data;
    },
    async inboxMessages(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<InternalMessageRecord[]>(`/internal-messages/inbox${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async sentMessages(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const query = params.toString();
      const response = await request<InternalMessageRecord[]>(`/internal-messages/sent${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async sendMessage(input: Record<string, unknown>) {
      const response = await request<InternalMessageRecord>("/internal-messages", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async markMessageRead(id: string) {
      const response = await request<InternalMessageRecord>(`/internal-messages/${id}/read`, { method: "POST" });
      return response.data;
    },
    async deleteMessage(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/internal-messages/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listNotifications(options: { page?: number; limit?: number; search?: string; status?: string; channel?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.channel) params.set("channel", options.channel);
      const query = params.toString();
      const response = await request<NotificationRecord[]>(`/notifications${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async unreadNotificationCount() {
      const response = await request<{ total: number }>("/notifications/unread-count");
      return response.data;
    },
    async createNotification(input: Record<string, unknown>) {
      const response = await request<NotificationRecord>("/notifications", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async markNotificationRead(id: string) {
      const response = await request<NotificationRecord>(`/notifications/${id}/read`, { method: "POST" });
      return response.data;
    },
    async markAllNotificationsRead() {
      const response = await request<{ updated: number }>("/notifications/read-all", { method: "POST" });
      return response.data;
    },
    async archiveNotification(id: string) {
      const response = await request<NotificationRecord>(`/notifications/${id}/archive`, { method: "POST" });
      return response.data;
    },
    async listNotificationTemplates(options: { page?: number; limit?: number; search?: string; channel?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      if (options.channel) params.set("channel", options.channel);
      const query = params.toString();
      const response = await request<NotificationTemplateRecord[]>(`/notification-templates${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async createNotificationTemplate(input: Record<string, unknown>) {
      const response = await request<NotificationTemplateRecord>("/notification-templates", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async updateNotificationTemplate(id: string, input: Record<string, unknown>) {
      const response = await request<NotificationTemplateRecord>(`/notification-templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async deleteNotificationTemplate(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/notification-templates/${id}`, { method: "DELETE" });
      return response.data;
    },
  };
}
