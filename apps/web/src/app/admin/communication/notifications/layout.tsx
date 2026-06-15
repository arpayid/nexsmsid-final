"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="notifications.view">{children}</PermissionGate>;
}
