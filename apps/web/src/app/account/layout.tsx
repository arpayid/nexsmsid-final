"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin-shell";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSecurity = pathname === "/account/security";

  if (!isSecurity) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
