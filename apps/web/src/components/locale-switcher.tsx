"use client";

import { Globe } from "lucide-react";
import { Button } from "@nexsmsid/ui";
import { getStoredLocale } from "../lib/use-translations";
import type { Locale } from "../i18n";

export function LocaleSwitcher() {
  const current: Locale = getStoredLocale();

  function toggle() {
    const next: Locale = current === "id" ? "en" : "id";
    localStorage.setItem("nexsmsid.locale", next);
    window.location.reload();
  }

  return (
    <Button aria-label="Switch language" onClick={toggle} variant="ghost" size="icon">
      <Globe className="h-5 w-5" />
      <span className="ml-1 text-xs font-bold">{current.toUpperCase()}</span>
    </Button>
  );
}
