"use client";

import { Globe } from "lucide-react";
import { Button } from "@nexsmsid/ui";
import { useTranslations } from "../lib/use-translations";
import type { Locale } from "../i18n";

export function LocaleSwitcher() {
  const { locale: current, setLocale } = useTranslations();

  function toggle() {
    const next: Locale = current === "id" ? "en" : "id";
    setLocale(next);
  }

  return (
    <Button aria-label="Switch language" onClick={toggle} variant="ghost" size="icon">
      <Globe className="h-5 w-5" />
      <span className="ml-1 text-xs font-bold">{current.toUpperCase()}</span>
    </Button>
  );
}
