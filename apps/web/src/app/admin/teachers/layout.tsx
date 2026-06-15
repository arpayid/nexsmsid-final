"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="teachers.view">{children}</PermissionGate>;
}
