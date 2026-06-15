import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal-shell";

export const metadata: Metadata = {
  title: "Portal Guru | NexSMSID",
  description: "Portal guru NexSMSID",
};

export default function TeacherLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PortalShell expectedPortal="teacher">{children}</PortalShell>;
}
