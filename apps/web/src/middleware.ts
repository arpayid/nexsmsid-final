import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "@/lib/auth-constants";
import { decodePortalFromAccessToken } from "@/lib/jwt-portal";
import { portalHomePath, resolvePortalForUser, type PortalKind } from "@/lib/portal-routing";

const protectedPrefixes = ["/admin", "/student", "/guardian", "/teacher", "/account"];

function requiredPortalForPath(pathname: string): PortalKind | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) return "teacher";
  if (pathname === "/student" || pathname.startsWith("/student/")) return "student";
  if (pathname === "/guardian" || pathname.startsWith("/guardian/")) return "guardian";
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(AUTH_ACCESS_COOKIE)?.value;
  if (accessToken) {
    const portal = decodePortalFromAccessToken(accessToken);
    const requiredPortal = requiredPortalForPath(pathname);

    if (requiredPortal && portal !== requiredPortal) {
      const fallbackPortal = portal ?? resolvePortalForUser(null);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = portalHomePath(fallbackPortal);
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (request.cookies.get(AUTH_REFRESH_COOKIE)?.value) {
    const sessionUrl = request.nextUrl.clone();
    sessionUrl.pathname = "/api/auth/session";
    sessionUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(sessionUrl);
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/guardian/:path*", "/teacher/:path*", "/account/:path*"],
};
