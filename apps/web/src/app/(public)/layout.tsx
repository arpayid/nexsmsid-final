import type { ReactNode } from "react";

import { PublicLayoutFrame } from "@/components/public-layout-frame";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PublicLayoutFrame>{children}</PublicLayoutFrame>;
}
