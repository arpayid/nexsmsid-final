"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function InternshipsLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="internships.view">{children}</PermissionGate>;
}
