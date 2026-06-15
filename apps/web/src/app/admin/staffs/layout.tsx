"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function StaffsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="staffs.view">{children}</PermissionGate>;
}
