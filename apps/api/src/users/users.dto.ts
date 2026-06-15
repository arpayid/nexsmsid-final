import { z } from "zod";

import { passwordValidator } from "../auth/auth.dto";

export const createUserSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  username: z.string().min(3).max(64).optional(),
  name: z.string().min(2).max(120),
  password: passwordValidator,
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  roleIds: z.array(z.string().min(1)).optional(),
  roleSlugs: z.array(z.string().min(1)).optional(),
});

export const updateUserSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase())
    .optional(),
  username: z.string().min(3).max(64).nullable().optional(),
  name: z.string().min(2).max(120).optional(),
  password: passwordValidator.optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  roleIds: z.array(z.string().min(1)).optional(),
  roleSlugs: z.array(z.string().min(1)).optional(),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordValidator,
    confirmPassword: z.string(),
    forceChangePassword: z.boolean().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sesuai",
    path: ["confirmPassword"],
  });

export const forceChangePasswordSchema = z.object({
  forceChangePassword: z.boolean().default(true),
});
