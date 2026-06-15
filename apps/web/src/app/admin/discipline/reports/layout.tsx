"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function DisciplineReportsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="reports.view">{children}</PermissionGate>;
}
