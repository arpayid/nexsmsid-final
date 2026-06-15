import { NextRequest, NextResponse } from "next/server";

import { AUTH_REFRESH_COOKIE } from "@/lib/auth-constants";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

function resolveSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get(AUTH_REFRESH_COOKIE)?.value;
  const nextPath = resolveSafeNextPath(request.nextUrl.searchParams.get("next"));

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const response = await fetch(`${apiInternalUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_REFRESH_COOKIE}=${refreshToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const redirectResponse = NextResponse.redirect(new URL(nextPath, request.url));
    const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];

    for (const cookie of setCookies) {
      redirectResponse.headers.append("Set-Cookie", cookie);
    }

    return redirectResponse;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
