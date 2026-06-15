import { z } from "zod";

export const createRoomSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(30)
    .transform((value) => value.toUpperCase()),
  name: z.string().min(2).max(120),
  type: z.string().max(80).nullable().optional(),
  capacity: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateRoomSchema = createRoomSchema.partial();
