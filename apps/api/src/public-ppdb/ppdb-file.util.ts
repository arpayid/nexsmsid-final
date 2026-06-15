import { join } from "node:path";

import { BadRequestException } from "@nestjs/common";

export const PPDB_STORAGE_PREFIX = "ppdb";

/** Normalize stored file reference to a storage-relative key (e.g. ppdb/{registrationId}/file.pdf). */
export function normalizePpdbStorageKey(fileUrlOrKey: string): string {
  let relative = fileUrlOrKey.trim();
  if (relative.startsWith("/uploads/")) relative = relative.slice("/uploads/".length);
  else if (relative.startsWith("uploads/")) relative = relative.slice("uploads/".length);
  else if (relative.startsWith("/")) relative = relative.slice(1);

  if (relative.includes("..")) {
    throw new BadRequestException("Path file tidak valid");
  }

  return relative;
}

export function resolvePpdbAbsolutePath(storagePath: string, fileUrlOrKey: string): string {
  return join(storagePath, normalizePpdbStorageKey(fileUrlOrKey));
}

export function assertPpdbFileKeyOwned(fileKey: string, registrationId: string): void {
  const normalized = normalizePpdbStorageKey(fileKey);
  const expectedPrefix = `${PPDB_STORAGE_PREFIX}/${registrationId}/`;
  if (!normalized.startsWith(expectedPrefix)) {
    throw new BadRequestException("File tidak valid untuk pendaftaran ini");
  }
}

export function contentTypeForPpdbFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
