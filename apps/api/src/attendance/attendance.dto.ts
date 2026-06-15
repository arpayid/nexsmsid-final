import { z } from "zod";

export const createSessionSchema = z.object({
  scheduleId: z.string().trim().min(1),
  date: z.coerce.date(),
  topic: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
});

export const updateSessionSchema = createSessionSchema.partial();

export const recordAttendanceSchema = z.object({
  records: z.array(
    z.object({
      studentId: z.string().trim().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "PERMIT", "SICK"]),
      note: z.string().trim().optional().default(""),
    }),
  ),
});

export const updateAttendanceRecordSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "PERMIT", "SICK"]),
  note: z.string().trim().optional().default(""),
});
