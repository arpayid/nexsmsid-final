"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="payroll.view">{children}</PermissionGate>;
}
