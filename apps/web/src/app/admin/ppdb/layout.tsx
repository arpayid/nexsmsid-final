"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function PpdbLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="ppdb.view">{children}</PermissionGate>;
}
