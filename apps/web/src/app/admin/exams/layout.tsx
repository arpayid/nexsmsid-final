"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="exams.view">{children}</PermissionGate>;
}
