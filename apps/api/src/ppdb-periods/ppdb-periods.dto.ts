import { z } from "zod";

export const createPpdbPeriodSchema = z.object({
  name: z.string().trim().min(2),
  academicYearId: z.string().trim().optional().default(""),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(true),
  quota: z.coerce.number().int().min(1).optional(),
});

export const updatePpdbPeriodSchema = createPpdbPeriodSchema.partial();
