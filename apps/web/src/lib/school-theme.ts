import type { SchoolProfile } from "@nexsmsid/api-client";

import { createBrowserApiClient } from "./api-client";

export type SchoolTheme = {
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
};

let cachedSchoolTheme: SchoolTheme | null = null;

export async function loadSchoolTheme(): Promise<SchoolTheme | null> {
  try {
    const api = createBrowserApiClient();
    const profile: SchoolProfile = await api.schoolProfile();
    return {
      logoUrl: profile.logoUrl,
      primaryColor: profile.primaryColor ?? "#14997a",
      secondaryColor: profile.secondaryColor ?? "#d4ede8",
      accentColor: profile.accentColor ?? "#f97316",
    };
  } catch {
    return null;
  }
}

export function applySchoolTheme(theme: SchoolTheme) {
  cachedSchoolTheme = theme;
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  if (theme.primaryColor) {
    const hsl = hexToHsl(theme.primaryColor);
    root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  }
  if (theme.secondaryColor) {
    const hsl = hexToHsl(theme.secondaryColor);
    root.style.setProperty("--secondary", `${hsl.h} ${hsl.s}% ${isDark ? 15 : 93}%`);
    root.style.setProperty("--secondary-foreground", `${hsl.h} ${hsl.s}% ${isDark ? 80 : 24}%`);
  }
  if (theme.accentColor) {
    const hsl = hexToHsl(theme.accentColor);
    root.style.setProperty("--accent", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty("--glow-accent", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  }
  if (theme.logoUrl) {
    const logoImg = document.querySelector("[data-school-logo]") as HTMLImageElement | null;
    if (logoImg) logoImg.src = theme.logoUrl;
  }
}

/** Re-apply cached school branding after light/dark mode changes. */
export function reapplyCachedSchoolTheme() {
  if (cachedSchoolTheme) applySchoolTheme(cachedSchoolTheme);
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 174, s: 72, l: 36 };
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
