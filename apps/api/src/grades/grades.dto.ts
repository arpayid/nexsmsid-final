import { z } from "zod";

export const createAssessmentSchema = z.object({
  teachingAssignmentId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(200),
  type: z.enum(["DAILY", "ASSIGNMENT", "QUIZ", "MIDTERM", "FINAL", "PRACTICAL", "PROJECT"]).default("DAILY"),
  maxScore: z.coerce.number().int().min(1).max(1000).default(100),
  weight: z.coerce.number().int().min(1).max(100).default(1),
  description: z.string().trim().optional().default(""),
  dueDate: z.coerce.date().optional(),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const inputScoresSchema = z.object({
  scores: z.array(
    z.object({
      studentId: z.string().trim().min(1),
      score: z.coerce.number().int().min(0).max(1000),
      notes: z.string().trim().optional().default(""),
    }),
  ),
});

export const updateScoreSchema = z.object({
  score: z.coerce.number().int().min(0).max(1000),
  notes: z.string().trim().optional().default(""),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
});

export const approveScoreSchema = z.object({
  status: z.enum(["APPROVED", "PUBLISHED"]),
});
