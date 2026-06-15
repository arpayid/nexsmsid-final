"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="master-data.view">{children}</PermissionGate>;
}
