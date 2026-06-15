import { z } from "zod";

const genderSchema = z.enum(["MALE", "FEMALE"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]);

const nullableString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const dateString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const createStudentSchema = z.object({
  nis: z.string().trim().min(2).max(40),
  nisn: nullableString,
  name: z.string().trim().min(2).max(160),
  gender: genderSchema,
  birthPlace: nullableString,
  birthDate: z
    .union([z.string(), z.date()])
    .transform((value) => (value === "" || value === null || value === undefined ? null : new Date(value)))
    .nullable()
    .optional(),
  address: nullableString,
  phone: nullableString,
  email: z
    .string()
    .trim()
    .email()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  classroomId: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  status: statusSchema.default("ACTIVE"),
  photoUrl: z
    .string()
    .trim()
    .url()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  enrolledAt: z
    .union([z.string(), z.date()])
    .transform((value) => (value === "" || value === null || value === undefined ? null : new Date(value)))
    .nullable()
    .optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const linkStudentGuardianSchema = z.object({
  guardianId: z.string().trim().min(1),
  isPrimary: z.boolean().optional().default(false),
});

export const updateStudentGuardianSchema = z.object({
  isPrimary: z.boolean(),
});

export const importBodySchema = z.object({}).strict();

export const _dateHelpers = { dateString, nullableString };
