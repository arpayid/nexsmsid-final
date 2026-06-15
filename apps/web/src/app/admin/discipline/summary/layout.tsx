"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function DisciplineSummaryLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="discipline.report">{children}</PermissionGate>;
}
