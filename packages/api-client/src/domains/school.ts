import type { ApiClientCore } from "../client";
import type { SchoolProfile } from "../types";

export function createSchoolApi({ request }: ApiClientCore) {
  return {
    async schoolProfile() {
      const response = await request<SchoolProfile>("/school-profile");
      return response.data;
    },
    async updateSchoolProfile(input: Partial<Omit<SchoolProfile, "createdAt" | "id" | "updatedAt">>) {
      const response = await request<SchoolProfile>("/school-profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return response.data;
    },
  };
}
