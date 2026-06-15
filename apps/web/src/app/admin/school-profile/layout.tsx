"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function SchoolProfileLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="school-profile.view">{children}</PermissionGate>;
}
