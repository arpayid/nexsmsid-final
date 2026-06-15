import { z } from "zod";

export const createClassroomSchema = z.object({
  competencyId: z.string().min(1),
  code: z
    .string()
    .min(2)
    .max(30)
    .transform((value) => value.toUpperCase()),
  name: z.string().min(2).max(120),
  level: z.coerce.number().int().min(1).max(12),
  isActive: z.boolean().default(true),
});

export const updateClassroomSchema = createClassroomSchema.partial();
