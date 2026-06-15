"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function TeachingAssignmentsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="teaching-assignments.view">{children}</PermissionGate>;
}
