import { z } from "zod";

import { createPpdbRegistrationSchema } from "../ppdb-registrations/ppdb-registrations.dto";
import { PPDB_STORAGE_PREFIX } from "./ppdb-file.util";

const ppdbFileKeySchema = z
  .string()
  .trim()
  .min(5)
  .max(512)
  .refine((value) => value.startsWith(`${PPDB_STORAGE_PREFIX}/`) && !value.includes(".."), {
    message: "fileKey tidak valid",
  });

export const publicPpdbRegisterSchema = createPpdbRegistrationSchema.extend({
  captchaToken: z.string().trim().optional(),
});

export const publicPpdbSetPinSchema = z.object({
  registrationNumber: z.string().min(3),
  phone: z.string().min(8),
  pin: z.string().regex(/^\d{6}$/, { message: "PIN harus 6 digit" }),
  captchaToken: z.string().trim().optional(),
});

export const publicPpdbUploadBodySchema = z.object({
  uploadToken: z.string().min(10).optional(),
  captchaToken: z.string().trim().optional(),
});

export const publicPpdbSubmitDocumentSchema = z
  .object({
    registrationNumber: z.string().min(3),
    phone: z.string().min(8),
    name: z.string().trim().min(1).max(200),
    fileKey: ppdbFileKeySchema,
    uploadToken: z.string().min(10),
    captchaToken: z.string().trim().optional(),
  })
  .strict();
