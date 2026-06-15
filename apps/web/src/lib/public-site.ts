import type { PublicCompetency } from "@nexsmsid/api-client";

export function competencySlug(code: string) {
  return code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

export function findCompetencyBySlug(competencies: PublicCompetency[], slug: string) {
  const normalized = slug.toLowerCase();
  return competencies.find((item) => competencySlug(item.code) === normalized) ?? null;
}

export function formatDateId(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function daysUntil(value: string | Date) {
  const target = typeof value === "string" ? new Date(value) : value;
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
