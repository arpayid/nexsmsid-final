"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="announcements.view">{children}</PermissionGate>;
}
