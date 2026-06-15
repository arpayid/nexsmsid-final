import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/public-metadata";
import { fetchPublicApi } from "@/lib/public-api";

import { JobDetailClient } from "./job-detail-client";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const job = await fetchPublicApi<{ title?: string; description?: string | null; companyName?: string | null }>(`/public/jobs/${id}`);
    const title = job?.title ?? "Lowongan Kerja";
    const description = job?.description?.slice(0, 160) ?? (job?.companyName ? `Lowongan di ${job.companyName}` : undefined);
    return buildPublicMetadata(title, description);
  } catch {
    return buildPublicMetadata("Lowongan Kerja");
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <JobDetailClient id={id} />;
}
