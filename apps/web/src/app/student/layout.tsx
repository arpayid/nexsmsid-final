import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal-shell";

export const metadata: Metadata = {
  title: "Portal Siswa | NexSMSID",
  description: "Portal siswa NexSMSID",
};

export default function StudentLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PortalShell expectedPortal="student">{children}</PortalShell>;
}
