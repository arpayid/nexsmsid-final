"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function AcademicReportsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="reports.view">{children}</PermissionGate>;
}
