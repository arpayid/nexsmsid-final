"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function GuardiansLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="guardians.view">{children}</PermissionGate>;
}
