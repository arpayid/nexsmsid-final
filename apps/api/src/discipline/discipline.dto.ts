import { z } from "zod";

const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().min(1).optional());
const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().optional());
const optionalDate = z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional());
const nonNegativePoint = z.coerce.number().int().min(0, "Point cannot be negative");

export const disciplineListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: optionalString,
  studentId: optionalString,
  classroomId: optionalString,
  ruleId: optionalString,
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  category: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  isActive: z.coerce.boolean().optional(),
});

export const createDisciplineRuleSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1, "Name is required"),
  description: optionalText,
  point: nonNegativePoint,
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  isActive: z.coerce.boolean().default(true),
});

export const updateDisciplineRuleSchema = createDisciplineRuleSchema.partial();

export const createViolationSchema = z.object({
  studentId: z.string().trim().min(1, "Student is required"),
  ruleId: z.string().trim().min(1, "Rule is required"),
  incidentDate: z.coerce.date(),
  description: optionalText,
  point: nonNegativePoint.optional(),
});

export const updateViolationSchema = createViolationSchema.partial().extend({
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
});

export const createAchievementSchema = z.object({
  studentId: z.string().trim().min(1, "Student is required"),
  title: z.string().trim().min(1, "Title is required"),
  category: z.string().trim().min(1, "Category is required"),
  point: nonNegativePoint,
  awardedAt: z.coerce.date(),
  description: optionalText,
});

export const updateAchievementSchema = createAchievementSchema.partial();
