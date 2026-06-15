import { z } from "zod";

export const createCompetencySchema = z.object({
  departmentId: z.string().min(1),
  code: z
    .string()
    .min(2)
    .max(30)
    .transform((value) => value.toUpperCase()),
  name: z.string().min(2).max(120),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateCompetencySchema = createCompetencySchema.partial();
