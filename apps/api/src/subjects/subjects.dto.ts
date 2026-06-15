import { z } from "zod";

export const createSubjectSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(30)
    .transform((value) => value.toUpperCase()),
  name: z.string().min(2).max(120),
  group: z.string().max(80).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateSubjectSchema = createSubjectSchema.partial();
