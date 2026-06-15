"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="students.view">{children}</PermissionGate>;
}
