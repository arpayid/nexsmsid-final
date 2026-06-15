"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function IndustryPartnersLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="industry-partners.view">{children}</PermissionGate>;
}
