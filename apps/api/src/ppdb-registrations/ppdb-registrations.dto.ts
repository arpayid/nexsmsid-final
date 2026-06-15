import { z } from "zod";

import { safeFileUrlSchema } from "../common/safe-url";

export const createPpdbRegistrationSchema = z.object({
  periodId: z.string().trim().min(1),
  name: z.string().trim().min(2),
  gender: z.enum(["MALE", "FEMALE"]),
  birthPlace: z.string().trim().optional().default(""),
  birthDate: z.coerce.date().optional(),
  address: z.string().trim().optional().default(""),
  phone: z.string().trim().min(8),
  pin: z.string().regex(/^\d{6}$/, { message: "PIN harus 6 digit" }),
  email: z.string().email().optional().or(z.literal("")),
  previousSchool: z.string().trim().optional().default(""),
  selectedDepartmentId: z.string().trim().optional().default(""),
  selectedCompetencyId: z.string().trim().optional().default(""),
});

export const adminCreatePpdbRegistrationSchema = createPpdbRegistrationSchema.omit({ pin: true });

export const updatePpdbRegistrationSchema = z.object({
  name: z.string().trim().min(2).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  birthPlace: z.string().trim().optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().min(8).optional(),
  email: z.string().email().optional().or(z.literal("")),
  previousSchool: z.string().trim().optional(),
  selectedDepartmentId: z.string().trim().optional(),
  selectedCompetencyId: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export const createPpdbDocumentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  fileUrl: safeFileUrlSchema.refine((value) => value.length > 0, { message: "fileUrl wajib diisi" }),
});

// Strict whitelist for document updates — never accept raw status/registrationId (mass-assignment guard).
export const updatePpdbDocumentSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    fileUrl: safeFileUrlSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.fileUrl !== undefined, {
    message: "Tidak ada perubahan yang dikirim",
  });

export const ppdbActionNoteSchema = z.object({
  note: z.string().trim().optional(),
});
