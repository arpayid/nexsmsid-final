import { z } from "zod";

export const createLessonHourSchema = z.object({
  name: z.string().min(2).max(80),
  order: z.coerce.number().int().positive(),
  startTime: z.string().min(4).max(5),
  endTime: z.string().min(4).max(5),
  isActive: z.boolean().default(true),
});

export const updateLessonHourSchema = createLessonHourSchema.partial();
