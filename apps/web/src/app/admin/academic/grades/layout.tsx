"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="grades.view">{children}</PermissionGate>;
}
