import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/public-metadata";
import { fetchPublicApi } from "@/lib/public-api";

import { AnnouncementDetailClient } from "./announcement-detail-client";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const item = await fetchPublicApi<{ title?: string; content?: string | null }>(`/public/announcements/${id}`);
    const title = item?.title ?? "Pengumuman";
    const description = item?.content?.slice(0, 160) ?? undefined;
    return buildPublicMetadata(title, description);
  } catch {
    return buildPublicMetadata("Pengumuman");
  }
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AnnouncementDetailClient id={id} />;
}
