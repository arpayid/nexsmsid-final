import { z } from "zod";

export const createPaymentCategorySchema = z.object({
  code: z
    .string()
    .min(2)
    .max(30)
    .transform((value) => value.toUpperCase()),
  name: z.string().min(2).max(120),
  description: z.string().max(500).nullable().optional(),
  defaultAmount: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updatePaymentCategorySchema = createPaymentCategorySchema.partial();
