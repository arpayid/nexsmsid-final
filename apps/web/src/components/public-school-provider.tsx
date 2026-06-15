"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import type { SchoolProfile } from "@nexsmsid/api-client";

import { applySchoolTheme } from "@/lib/school-theme";

type PublicSchoolContextValue = {
  profile: SchoolProfile | null;
};

const PublicSchoolContext = createContext<PublicSchoolContextValue>({ profile: null });

export function PublicSchoolProvider({ children, profile }: Readonly<{ children: ReactNode; profile: SchoolProfile | null }>) {
  useEffect(() => {
    if (profile) {
      applySchoolTheme({
        logoUrl: profile.logoUrl,
        primaryColor: profile.primaryColor ?? undefined,
        secondaryColor: profile.secondaryColor ?? undefined,
        accentColor: profile.accentColor ?? undefined,
      });
    }
  }, [profile]);

  return <PublicSchoolContext.Provider value={{ profile }}>{children}</PublicSchoolContext.Provider>;
}

export function usePublicSchool() {
  return useContext(PublicSchoolContext);
}
