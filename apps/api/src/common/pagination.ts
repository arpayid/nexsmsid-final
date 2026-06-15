export const MAX_LIST_LIMIT = 100;

export function capListLimit(rawLimit: unknown, fallback = 20): number {
  const parsed = Number(rawLimit);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), MAX_LIST_LIMIT);
}
