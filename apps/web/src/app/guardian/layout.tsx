import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal-shell";

export const metadata: Metadata = {
  title: "Portal Wali | NexSMSID",
  description: "Portal orang tua/wali NexSMSID",
};

export default function GuardianLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PortalShell expectedPortal="guardian">{children}</PortalShell>;
}
