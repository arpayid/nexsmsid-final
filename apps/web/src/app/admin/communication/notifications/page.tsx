"use client";

import { NotificationCenter } from "@/components/notification-center";

export default function AdminNotificationsPage() {
  return (
    <NotificationCenter
      allowArchive
      allowCreate
      breadcrumb={["Admin", "Komunikasi", "Notifikasi"]}
      description="Kelola notifikasi in-app dan fondasi channel eksternal."
      eyebrow="Notifikasi"
      title="Notifikasi"
    />
  );
}
