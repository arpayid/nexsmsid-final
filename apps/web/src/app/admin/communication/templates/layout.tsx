"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function NotificationTemplatesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="notification-templates.view">{children}</PermissionGate>;
}
