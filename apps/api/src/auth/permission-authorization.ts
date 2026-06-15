import { ForbiddenException } from "@nestjs/common";

import { AuthenticatedUser } from "./auth.types";

export const IMMUTABLE_ROLE_SLUGS = ["super-admin"];

export function assertActorHasPermissions(actor: AuthenticatedUser, permissionKeys: string[], context?: string): void {
  if (actor.permissions.includes("*") || !permissionKeys.length) {
    return;
  }

  const actorPermissions = new Set(actor.permissions);
  const missing = [...new Set(permissionKeys)].filter((key) => !actorPermissions.has(key));

  if (missing.length > 0) {
    const suffix = context ? ` (${context})` : "";
    throw new ForbiddenException(`You do not have permission to grant: ${missing.join(", ")}${suffix}`);
  }
}

export function assertCanModifyRole(
  actor: AuthenticatedUser,
  existingSlug: string,
  changes: {
    slug?: string;
    isActive?: boolean;
    permissionKeys?: string[];
  },
): void {
  if (!IMMUTABLE_ROLE_SLUGS.includes(existingSlug)) {
    return;
  }

  if (changes.slug !== undefined) {
    throw new ForbiddenException(`The "${existingSlug}" role slug cannot be modified`);
  }

  if (changes.isActive !== undefined) {
    throw new ForbiddenException(`The "${existingSlug}" role status cannot be modified`);
  }

  if (changes.permissionKeys !== undefined) {
    throw new ForbiddenException(`The "${existingSlug}" role permissions cannot be modified`);
  }
}
