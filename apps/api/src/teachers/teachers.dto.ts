import { z } from "zod";

const genderSchema = z.enum(["MALE", "FEMALE"]);
const employmentStatusSchema = z.enum(["PERMANENT", "CONTRACT", "HONORARY", "PROBATION"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "RESIGNED", "TRANSFERRED"]);

const nullableString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const createTeacherSchema = z.object({
  nip: nullableString,
  nuptk: nullableString,
  name: z.string().trim().min(2).max(160),
  gender: genderSchema,
  birthPlace: nullableString,
  birthDate: z
    .union([z.string(), z.date()])
    .transform((value) => (value === "" || value === null || value === undefined ? null : new Date(value)))
    .nullable()
    .optional(),
  phone: nullableString,
  email: z
    .string()
    .trim()
    .email()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  address: nullableString,
  employmentStatus: employmentStatusSchema.default("PERMANENT"),
  status: statusSchema.default("ACTIVE"),
  photoUrl: z
    .string()
    .trim()
    .url()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

export const importBodySchema = z.object({}).strict();
