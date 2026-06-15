import type { HealthStatus } from "@nexsmsid/types";
import type { ApiResponse, ListMeta, PaginatedList } from "./types";
import { createAuthApi } from "./domains/auth";
import { createUsersApi } from "./domains/users";
import { createSchoolApi } from "./domains/school";
import { createMasterDataApi } from "./domains/master-data";
import { createPeopleApi } from "./domains/people";
import { createAcademicApi } from "./domains/academic";
import { createFinanceApi } from "./domains/finance";
import { createPpdbApi } from "./domains/ppdb";
import { createBkkApi } from "./domains/bkk";
import { createCommunicationApi } from "./domains/communication";
import { createCounselingDisciplineApi } from "./domains/counseling-discipline";
import { createLettersApi } from "./domains/letters";
import { createInventoryApi } from "./domains/inventory";
import { createLibraryApi } from "./domains/library";
import { createHrPayrollApi } from "./domains/hr-payroll";
import { createExamsApi } from "./domains/exams";
import { createReportsApi } from "./domains/reports";
import { createPublicApi } from "./domains/public";

export type { ApiResponse };

let refreshInFlight: Promise<boolean> | null = null;

async function performCookieRefresh(fetcher: typeof fetch, baseUrl: string, credentials: RequestCredentials): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetcher(`${baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials,
          body: JSON.stringify({}),
        });
        const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
        return response.ok && payload?.success === true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export type ApiClientOptions = {
  /** Optional Bearer token override (integration tests / non-browser clients). */
  accessToken?: string | (() => string | null | undefined);
  baseUrl?: string;
  fetcher?: typeof fetch;
  /** Send cookies on requests. Defaults to `include` for httpOnly cookie auth. */
  credentials?: RequestCredentials;
};

export type ApiClientCore = {
  request<TData>(path: string, init?: RequestInit): Promise<ApiResponse<TData>>;
  downloadFile(path: string, fallbackFilename: string): Promise<Blob>;
  uploadFile<TData>(
    path: string,
    file: Blob | File,
    fieldName?: string,
    fallbackFilename?: string,
    extraFields?: Record<string, string>,
  ): Promise<TData>;
  triggerBrowserDownload(blob: Blob, filename: string): void;
  normalizeListResponse: {
    <T>(response: ApiResponse<T[] | PaginatedList<T>>): { data: T[]; meta?: ListMeta };
    (response: ApiResponse<any>): { data: any[]; meta?: ListMeta };
  };
};

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
  const fetcher = options.fetcher ?? fetch;
  const credentials = options.credentials ?? "include";

  function authHeaders() {
    const token = typeof options.accessToken === "function" ? options.accessToken() : options.accessToken;
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  async function request<TData>(path: string, init: RequestInit = {}, retried = false) {
    const headers = new Headers(init.headers);
    const token = typeof options.accessToken === "function" ? options.accessToken() : options.accessToken;

    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials,
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse<TData> | null;

    if (response.status === 401 && path !== "/auth/login" && path !== "/auth/refresh" && !retried) {
      const refreshed = await performCookieRefresh(fetcher, baseUrl, credentials);
      if (refreshed) {
        return request<TData>(path, init, true);
      }
    }

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message ?? `NexSMSID API request failed: ${response.status}`);
    }

    return payload;
  }

  async function downloadFile(path: string, fallbackFilename: string): Promise<Blob> {
    const response = await fetcher(`${baseUrl}${path}`, { headers: authHeaders(), credentials });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
      throw new Error(payload?.message ?? `NexSMSID API request failed: ${response.status}`);
    }
    const blob = await response.blob();
    const headerDisposition = response.headers.get("Content-Disposition") ?? "";
    const match = headerDisposition.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1] ?? fallbackFilename;
    return new Blob([blob], { type: blob.type || "application/octet-stream" }).slice(0, blob.size, blob.type) as Blob;
  }

  function triggerBrowserDownload(blob: Blob, filename: string) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildQuery(options: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
    const query = params.toString();
    return query ? `?${query}` : "";
  }

  function normalizeListResponse<T>(response: ApiResponse<T[] | PaginatedList<T> | any>): { data: T[] | any[]; meta?: ListMeta } {
    const payload = response.data;
    if (Array.isArray(payload)) return { data: payload, meta: response.meta as ListMeta | undefined };
    if (payload && typeof payload === "object" && "data" in payload) {
      const paginated = payload as PaginatedList<T>;
      return { data: paginated.data ?? [], meta: paginated.meta ?? (response.meta as ListMeta | undefined) };
    }
    return { data: [], meta: response.meta as ListMeta | undefined };
  }

  async function uploadFile<TData>(
    path: string,
    file: Blob | File,
    fieldName = "file",
    fallbackFilename = "upload.xlsx",
    extraFields?: Record<string, string>,
  ) {
    const formData = new FormData();
    const filename = (file as { name?: string }).name ?? fallbackFilename;
    formData.append(fieldName, file, filename);
    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        formData.append(key, value);
      }
    }
    const response = await fetcher(`${baseUrl}${path}`, {
      method: "POST",
      headers: authHeaders(),
      credentials,
      body: formData,
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse<TData> | null;
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message ?? `NexSMSID API request failed: ${response.status}`);
    }
    return payload.data;
  }

  const core: ApiClientCore = { request, downloadFile, uploadFile, triggerBrowserDownload, normalizeListResponse };

  return {
    async health(): Promise<HealthStatus> {
      const response = await request<HealthStatus>("/health");
      return response.data;
    },

    ...createAuthApi(core),
    ...createUsersApi(core),
    ...createSchoolApi(core),
    ...createMasterDataApi(core),
    ...createPeopleApi(core),
    ...createAcademicApi(core),
    ...createFinanceApi(core),
    ...createPpdbApi(core),
    ...createBkkApi(core),
    ...createCommunicationApi(core),
    ...createCounselingDisciplineApi(core),
    ...createLettersApi(core),
    ...createInventoryApi(core),
    ...createLibraryApi(core),
    ...createHrPayrollApi(core),
    ...createExamsApi(core),
    ...createReportsApi(core),
    ...createPublicApi(core),
  };
}
