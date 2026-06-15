"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="library.view">{children}</PermissionGate>;
}
