"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="dashboard.view">{children}</PermissionGate>;
}
