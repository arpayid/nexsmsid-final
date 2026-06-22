import { z } from "zod";

// ========================================================================
// Shared API response types
// ========================================================================

export type ApiResponse<TData = unknown, TMeta = unknown> = {
  success: boolean;
  message: string;
  data: TData;
  meta?: TMeta;
};

export type ListMeta = { total?: number; page?: number; limit?: number };
export type PaginatedList<TItem> = { data: TItem[]; meta?: ListMeta };
export type ListQueryParams = Record<string, string | number | boolean | undefined>;

// ========================================================================
// Auth
// ========================================================================

export type AuthUser = { id: string; email: string; name: string; roles: string[]; permissions: string[]; forceChangePassword?: boolean };
export type AuthSession = { user: AuthUser; expiresIn: number; tokenType?: "Bearer"; accessToken?: string; refreshToken?: string };

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// ========================================================================
// Common enums
// ========================================================================

export const PersonStatus = z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "RESIGNED"]);
export const Gender = z.enum(["MALE", "FEMALE"]);
export const DayOfWeek = z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);
export const AttendanceStatus = z.enum(["PRESENT", "SICK", "PERMIT", "ABSENT", "LATE"]);

export type PersonStatus = z.infer<typeof PersonStatus>;
export type Gender = z.infer<typeof Gender>;
export type DayOfWeek = z.infer<typeof DayOfWeek>;
export type AttendanceStatus = z.infer<typeof AttendanceStatus>;

// ========================================================================
// Common interfaces
// ========================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DateRangeParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
}
