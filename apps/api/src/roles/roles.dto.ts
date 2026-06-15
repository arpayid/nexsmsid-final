import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(240).nullable().optional(),
  isActive: z.boolean().default(true),
  permissionKeys: z.array(z.string().min(1)).optional(),
});

export const updateRoleSchema = roleSchema.partial();
