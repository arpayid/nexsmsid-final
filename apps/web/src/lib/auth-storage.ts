import type { AuthSession, AuthUser } from "@nexsmsid/api-client";

const USER_STORAGE_KEY = "nexsmsid.user";

/** Cached user profile for display only — authorization is enforced server-side via httpOnly cookies. */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(USER_STORAGE_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser) {
  window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/** Persist the authenticated user profile after login/refresh (display cache only; tokens live in httpOnly cookies). */
export function storeAuthSession(session: AuthSession) {
  storeUser(session.user);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(USER_STORAGE_KEY);
}

/** @deprecated Tokens are no longer stored in the browser — use storeAuthSession instead. */
export function storeAuthTokens(session: AuthSession) {
  storeAuthSession(session);
}

/** @deprecated Use clearAuthSession instead. */
export function clearAuthTokens() {
  clearAuthSession();
}

/** @deprecated Access tokens are httpOnly cookies and not readable from JavaScript. */
export function getAccessToken(): string | null {
  return null;
}

/** @deprecated Refresh tokens are httpOnly cookies and not readable from JavaScript. */
export function getRefreshToken(): string | null {
  return null;
}

/** @deprecated No longer needed — middleware reads the httpOnly access cookie directly. */
export function syncSessionCookieFromStorage() {}
