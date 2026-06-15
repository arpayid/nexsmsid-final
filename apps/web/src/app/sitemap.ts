import type { MetadataRoute } from "next";

import type { JobVacancyRecord, PublicCompetency } from "@nexsmsid/api-client";

import { competencySlug } from "@/lib/public-site";
import { fetchPublicApi } from "@/lib/public-api";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nexsmsid.dev";

type PaginatedPublicResponse<T> = T[];

type AnnouncementSummary = { id: string; updatedAt?: string; publishedAt?: string };

function staticEntry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") {
  return { url: `${BASE_URL}${path}`, lastModified: new Date(), changeFrequency, priority };
}

async function fetchPaginatedPublic<T>(path: string): Promise<T[]> {
  const items = await fetchPublicApi<PaginatedPublicResponse<T>>(`${path}?limit=100`);
  return items ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [competencies, jobs, announcements] = await Promise.all([
    fetchPublicApi<PublicCompetency[]>("/public/competencies"),
    fetchPaginatedPublic<JobVacancyRecord>("/public/jobs"),
    fetchPaginatedPublic<AnnouncementSummary>("/public/announcements"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    staticEntry("/", 1.0),
    staticEntry("/tentang", 0.8),
    staticEntry("/kontak", 0.7),
    staticEntry("/mitra", 0.7),
    staticEntry("/jurusan", 0.8),
    staticEntry("/ppdb", 0.8),
    staticEntry("/ppdb/register", 0.8),
    staticEntry("/ppdb/status", 0.7),
    staticEntry("/jobs", 0.7),
    staticEntry("/announcements", 0.7),
    staticEntry("/login", 0.3, "monthly"),
  ];

  const competencyPages: MetadataRoute.Sitemap = (competencies ?? []).map((item) => ({
    url: `${BASE_URL}/jurusan/${competencySlug(item.code)}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const jobPages: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${BASE_URL}/jobs/${job.id}`,
    lastModified: job.updatedAt ? new Date(job.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const announcementPages: MetadataRoute.Sitemap = announcements.map((item) => ({
    url: `${BASE_URL}/announcements/${item.id}`,
    lastModified: new Date(item.updatedAt ?? item.publishedAt ?? Date.now()),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticPages, ...competencyPages, ...jobPages, ...announcementPages];
}
