"use client";

import { NotificationCenter } from "@/components/notification-center";

export default function TeacherNotificationsPage() {
  return (
    <NotificationCenter
      breadcrumb={["Portal Guru", "Notifikasi"]}
      description="Pantau pemberitahuan terbaru untuk Anda sebagai guru."
      eyebrow="Portal Guru"
      title="Notifikasi"
    />
  );
}
