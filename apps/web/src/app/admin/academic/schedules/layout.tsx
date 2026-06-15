"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function SchedulesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="schedules.view">{children}</PermissionGate>;
}
