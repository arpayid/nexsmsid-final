const API_BASE = `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1`;

type PublicApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchPublicApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      next: { revalidate: 60 },
    });
    const payload = (await response.json()) as PublicApiEnvelope<T>;
    if (!response.ok || !payload?.success) return null;
    return payload.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[public-api] fetch failed for ${path}:`, error);
    }
    return null;
  }
}

export function getPublicApiBaseUrl() {
  return API_BASE;
}
