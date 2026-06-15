"use client";

import { NotificationCenter } from "@/components/notification-center";

export default function TeacherNotificationsPage() {
  return (
    <NotificationCenter
      breadcrumb={["Portal Guru", "Notifikasi"]}
      description="Pemberitahuan terbaru untuk Anda"
      eyebrow="Portal Guru"
      title="Notifikasi"
    />
  );
}
