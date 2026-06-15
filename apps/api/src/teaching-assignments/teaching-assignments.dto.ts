import { z } from "zod";

export const createTeachingAssignmentSchema = z.object({
  teacherId: z.string().trim().min(1),
  subjectId: z.string().trim().min(1),
  classroomId: z.string().trim().min(1),
  academicYearId: z.string().trim().min(1),
  semesterId: z.string().trim().min(1),
  isActive: z.boolean().default(true),
});

export const updateTeachingAssignmentSchema = createTeachingAssignmentSchema.partial();
