"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function CounselingLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="counseling.view">{children}</PermissionGate>;
}
