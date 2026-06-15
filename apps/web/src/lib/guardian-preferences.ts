"use client";

const STORAGE_KEY = "nexsmsid.guardian.childId";

export function getStoredChildId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredChildId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(STORAGE_KEY, id);
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function clearStoredChildIdIfForbidden(error: unknown): void {
  if (error instanceof Error && /:\s*403\b/.test(error.message)) {
    setStoredChildId(null);
  }
}
