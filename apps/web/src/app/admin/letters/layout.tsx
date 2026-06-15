"use client";

import { PermissionGate } from "@/components/permission-gate";

export default function LettersLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="letters.view">{children}</PermissionGate>;
}
