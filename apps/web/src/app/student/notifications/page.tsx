"use client";

import { NotificationCenter } from "@/components/notification-center";

export default function StudentNotificationsPage() {
  return (
    <NotificationCenter
      breadcrumb={["Portal Siswa", "Notifikasi"]}
      description="Pantau pemberitahuan akademik dan informasi sekolah untuk Anda."
      eyebrow="Portal Siswa"
      title="Notifikasi"
    />
  );
}
