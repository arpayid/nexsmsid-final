import { SetMetadata } from "@nestjs/common";

export const ALLOW_PENDING_PASSWORD_CHANGE_KEY = "allowPendingPasswordChange";

/**
 * Marks an endpoint as accessible by users flagged with `forceChangePassword`.
 * All other authenticated endpoints reject such users until they rotate their password.
 */
export const AllowPendingPasswordChange = () => SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE_KEY, true);
