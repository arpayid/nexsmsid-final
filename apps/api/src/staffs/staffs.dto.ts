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

export const createStaffSchema = z.object({
  nip: nullableString,
  name: z.string().trim().min(2).max(160),
  gender: genderSchema,
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
  position: z.string().trim().min(2).max(120),
  department: nullableString,
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

export const updateStaffSchema = createStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export const importBodySchema = z.object({}).strict();
