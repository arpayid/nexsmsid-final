"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="inventory.view">{children}</PermissionGate>;
}
