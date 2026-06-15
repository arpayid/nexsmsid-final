"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="messages.view">{children}</PermissionGate>;
}
