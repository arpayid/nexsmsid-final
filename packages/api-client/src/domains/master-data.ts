import type { ApiClientCore } from "../client";
import type { MasterDataRecord, MasterDataListOptions } from "../types";

export function createMasterDataApi({ request }: ApiClientCore) {
  return {
    async masterDataList(resource: string, options: MasterDataListOptions = {}) {
      const params = new URLSearchParams();

      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);

      const query = params.toString();
      return request<MasterDataRecord[]>(`/${resource}${query ? `?${query}` : ""}`);
    },
    async masterDataCreate(resource: string, input: Record<string, unknown>) {
      const response = await request<MasterDataRecord>(`/${resource}`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async masterDataUpdate(resource: string, id: string, input: Record<string, unknown>) {
      const response = await request<MasterDataRecord>(`/${resource}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
    async masterDataDelete(resource: string, id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/${resource}/${id}`, {
        method: "DELETE",
      });
      return response.data;
    },
  };
}
