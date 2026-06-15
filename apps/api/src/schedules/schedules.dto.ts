import { z } from "zod";

export const createScheduleSchema = z.object({
  teachingAssignmentId: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  lessonHourId: z.string().trim().min(1),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
});

export const updateScheduleSchema = createScheduleSchema.partial();
