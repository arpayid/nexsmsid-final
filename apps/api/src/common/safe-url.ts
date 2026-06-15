import { z } from "zod";

/** Relative path or http(s) URL; blocks javascript:/data: and other unsafe schemes. */
export const safeFileUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value), {
    message: "URL harus berupa path relatif (diawali '/') atau URL http(s)",
  });
