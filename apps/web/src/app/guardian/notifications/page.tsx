"use client";

import { NotificationCenter } from "@/components/notification-center";

export default function GuardianNotificationsPage() {
  return (
    <NotificationCenter
      breadcrumb={["Portal Wali", "Notifikasi"]}
      description="Pemberitahuan untuk Anda"
      eyebrow="Portal Wali"
      title="Notifikasi"
    />
  );
}
