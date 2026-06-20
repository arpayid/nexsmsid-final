import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { getMessages, getNestedValue, type Locale } from "../i18n";

const STORAGE_KEY = "nexsmsid.locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "id";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "id") return stored;
  return navigator.language?.startsWith("en") ? "en" : "id";
}

export function useTranslations() {
  const { data: locale = "id" } = useSWR<Locale>("locale", getStoredLocale, {
    fallbackData: typeof window === "undefined" ? "id" : getStoredLocale(),
  });

  const messages = getMessages(locale);

  const t = useCallback((key: string) => getNestedValue(messages, key), [messages]);

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem(STORAGE_KEY, newLocale);
    void mutate("locale", newLocale, false);
  }, []);

  return { t, locale, setLocale };
}
