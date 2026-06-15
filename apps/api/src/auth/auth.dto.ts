import { z } from "zod";

export const passwordValidator = z
  .string()
  .min(12, "Password minimal 12 karakter")
  .regex(/[a-z]/, "Password harus memiliki huruf kecil")
  .regex(/[A-Z]/, "Password harus memiliki huruf besar")
  .regex(/[0-9]/, "Password harus memiliki angka")
  .regex(/[^a-zA-Z0-9]/, "Password harus memiliki simbol");

export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sesuai",
    path: ["confirmPassword"],
  });
