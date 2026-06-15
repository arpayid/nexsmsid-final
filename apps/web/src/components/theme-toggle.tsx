"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore } from "react";

import { Button } from "@nexsmsid/ui";

import { reapplyCachedSchoolTheme } from "@/lib/school-theme";

const THEME_STORAGE_KEY = "nexsmsid.theme";
const THEME_CHANGE_EVENT = "nexsmsid:theme-change";

function readDarkMode(): boolean {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function subscribeTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, readDarkMode, () => false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    reapplyCachedSchoolTheme();
  }, [dark]);

  const toggle = useCallback(() => {
    const next = !readDarkMode();
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return (
    <Button aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle} variant="ghost" size="icon">
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
