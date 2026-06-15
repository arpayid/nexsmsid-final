"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function DisciplineViolationsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="discipline.view">{children}</PermissionGate>;
}
