"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function DisciplineRulesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="discipline.view">{children}</PermissionGate>;
}
