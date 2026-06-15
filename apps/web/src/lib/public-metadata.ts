import type { Metadata } from "next";

import type { SchoolProfile } from "@nexsmsid/api-client";

import { fetchPublicApi } from "@/lib/public-api";

export async function buildPublicMetadata(title: string, description?: string): Promise<Metadata> {
  const profile = await fetchPublicApi<SchoolProfile>("/public/school-profile");
  const schoolName = profile?.name ?? "Sekolah";
  const metaDescription = description ?? profile?.description ?? undefined;

  return {
    title: `${title} — ${schoolName}`,
    description: metaDescription,
    openGraph: {
      title: `${title} — ${schoolName}`,
      description: metaDescription,
      siteName: schoolName,
    },
  };
}

export function parseVisionMission(description?: string | null) {
  if (!description?.trim()) {
    return { vision: null as string | null, mission: null as string | null };
  }

  const visionMatch = description.match(/(?:^|\n)\s*visi\s*:?\s*([\s\S]*?)(?=\n\s*misi\s*:?|$)/i);
  const missionMatch = description.match(/(?:^|\n)\s*misi\s*:?\s*([\s\S]*)/i);

  if (visionMatch || missionMatch) {
    return {
      vision: visionMatch?.[1]?.trim() || null,
      mission: missionMatch?.[1]?.trim() || null,
    };
  }

  return { vision: description.trim(), mission: null };
}
