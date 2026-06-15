"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function BkkLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="bkk.view">{children}</PermissionGate>;
}
