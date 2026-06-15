import { z } from "zod";

const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().min(1).optional());
const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().optional());
const optionalDate = z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional());

export const counselingListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: optionalString,
  studentId: optionalString,
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  category: optionalString,
  counselorId: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
});

export const createCounselingCaseSchema = z.object({
  studentId: z.string().trim().min(1, "Student is required"),
  counselorId: optionalString,
  title: z.string().trim().min(2, "Title is required"),
  category: z.string().trim().min(1, "Category is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  description: z.string().trim().min(1, "Description is required"),
  followUpDate: optionalDate,
});

export const updateCounselingCaseSchema = z.object({
  title: z.string().trim().min(2).optional(),
  category: z.string().trim().min(1).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  description: z.string().trim().min(1).optional(),
  resolution: optionalText,
  followUpDate: optionalDate,
  counselorId: optionalString,
});

export const closeCounselingCaseSchema = z.object({
  resolution: optionalText,
});

export const createCounselingNoteSchema = z.object({
  note: z.string().trim().min(1, "Note is required"),
  visibility: z.enum(["PRIVATE", "COUNSELOR_ONLY", "HOMEROOM_TEACHER", "PARENT_VISIBLE"]).default("PRIVATE"),
});
