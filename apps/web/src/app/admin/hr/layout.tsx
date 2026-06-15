"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="payroll.view">{children}</PermissionGate>;
}
