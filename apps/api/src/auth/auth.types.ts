import type { PortalKind } from "@nexsmsid/types";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  forceChangePassword?: boolean;
  passwordChangedAt?: string;
};

export type JwtAccessPayload = {
  sub: string;
  email: string;
  type: "access";
  passwordChangedAt?: string;
  portal?: PortalKind;
};

export type JwtRefreshPayload = {
  sub: string;
  jti: string;
  type: "refresh";
};

export type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export type RequestWithUser = {
  user?: AuthenticatedUser;
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string | undefined>;
  ip?: string;
  method: string;
  originalUrl?: string;
  url: string;
};

export function getRequestMeta(request: RequestWithUser): RequestMeta {
  const userAgent = request.headers["user-agent"];
  const forwardedFor = request.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor?.split(",")[0]?.trim() ?? request.ip);

  return {
    ipAddress,
    userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
  };
}
