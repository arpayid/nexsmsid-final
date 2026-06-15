import type { PortalKind } from "./portal-routing";

const PORTAL_KINDS = new Set<PortalKind>(["admin", "teacher", "student", "guardian", "unassigned"]);

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }
  return atob(padded);
}

/** Decode the `portal` claim from a JWT access token (no signature verification — routing hint only). */
export function decodePortalFromAccessToken(token: string): PortalKind | null {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as { portal?: unknown };
    if (typeof payload.portal !== "string" || !PORTAL_KINDS.has(payload.portal as PortalKind)) {
      return null;
    }

    return payload.portal as PortalKind;
  } catch {
    return null;
  }
}
