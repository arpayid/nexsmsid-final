"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="alumni.view">{children}</PermissionGate>;
}
