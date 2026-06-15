import { z } from "zod";

const relationSchema = z.enum(["FATHER", "MOTHER", "GUARDIAN", "GRANDPARENT", "SIBLING", "OTHER"]);

const nullableString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const createGuardianSchema = z.object({
  name: z.string().trim().min(2).max(160),
  relation: relationSchema,
  phone: z.string().trim().min(6).max(40),
  email: z
    .string()
    .trim()
    .email()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  occupation: nullableString,
  address: nullableString,
});

export const updateGuardianSchema = createGuardianSchema.partial();

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;

export const importBodySchema = z.object({}).strict();
