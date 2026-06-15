import { createApiClient } from "@nexsmsid/api-client";

export function createBrowserApiClient() {
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api/v1",
    credentials: "include",
  });
}
