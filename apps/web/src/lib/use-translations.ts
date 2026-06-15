import { useCallback } from "react";
import { getMessages, getNestedValue, type Locale } from "../i18n";

const STORAGE_KEY = "nexsmsid.locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "id";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "id") return stored;
  return navigator.language?.startsWith("en") ? "en" : "id";
}

export function useTranslations() {
  const locale: Locale = getStoredLocale();
  const messages = getMessages(locale);

  const t = useCallback((key: string) => getNestedValue(messages, key), [messages]);
  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem(STORAGE_KEY, newLocale);
    window.location.reload();
  }, []);

  return { t, locale, setLocale };
}
