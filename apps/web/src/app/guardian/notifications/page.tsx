"use client";

import { NotificationCenter } from "@/components/notification-center";

export default function GuardianNotificationsPage() {
  return (
    <NotificationCenter
      breadcrumb={["Portal Wali", "Notifikasi"]}
      description="Pantau pemberitahuan terkait anak dan informasi sekolah."
      eyebrow="Portal Wali"
      title="Notifikasi"
    />
  );
}
