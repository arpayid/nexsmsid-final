import type { ReactNode } from "react";

import type { SchoolProfile } from "@nexsmsid/api-client";

import { PublicSchoolProvider } from "@/components/public-school-provider";
import { PublicShell } from "@/components/public-shell";
import { fetchPublicApi } from "@/lib/public-api";

export async function PublicLayoutFrame({ children }: Readonly<{ children: ReactNode }>) {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");

  return (
    <PublicSchoolProvider profile={profile}>
      <PublicShell>{children}</PublicShell>
    </PublicSchoolProvider>
  );
}
