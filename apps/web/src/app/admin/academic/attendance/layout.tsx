"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="attendance.view">{children}</PermissionGate>;
}
