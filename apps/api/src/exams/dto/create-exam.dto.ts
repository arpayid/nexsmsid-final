import { z } from "zod";

export const createExamSchema = z.object({
  examTypeId: z.string().min(1),
  academicYearId: z.string().min(1),
  semesterId: z.string().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().positive(),
  totalQuestions: z.number().int().optional(),
  maxScore: z.number().int().optional(),
  passingScore: z.number().int().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "GRADED", "CANCELLED"]).optional(),
  isCbt: z.boolean().default(false),
  instruction: z.string().optional(),
  notes: z.string().optional(),
});

export const updateExamSchema = createExamSchema.partial();

export const listExamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  examTypeId: z.string().optional(),
  academicYearId: z.string().optional(),
});

export const createExamTypeSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateExamTypeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createExamRoomSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().optional(),
  location: z.string().optional(),
});

export const updateExamRoomSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createQuestionBankSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createExamScheduleSchema = z.object({
  roomId: z.string().optional(),
  date: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  supervisorId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateExamScheduleSchema = createExamScheduleSchema.partial();

export const createExamSessionSchema = z.object({
  code: z.string().min(1),
  name: z.string().optional(),
});

export const addExamQuestionSchema = z.object({
  bankId: z.string().optional(),
  number: z.number().int(),
  type: z.enum(["MULTIPLE_CHOICE", "ESSAY", "TRUE_FALSE", "MATCHING", "SHORT_ANSWER"]).optional(),
  content: z.string().min(1),
  options: z.unknown().optional(),
  correctAnswer: z.string().optional(),
  score: z.number().int().optional(),
  attachmentUrl: z.string().optional(),
});

export const updateExamQuestionSchema = addExamQuestionSchema.partial();

export const submitParticipantResultsSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.string(),
      }),
    )
    .default([]),
});

export const gradeParticipantSchema = z.object({
  score: z.number(),
  notes: z.string().optional(),
});
