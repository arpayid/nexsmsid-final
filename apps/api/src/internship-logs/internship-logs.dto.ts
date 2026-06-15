import { z } from "zod";

export const internshipLogListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
});

export const createInternshipLogSchema = z.object({
  date: z.coerce.date(),
  activity: z.string().trim().min(3),
  obstacle: z.string().trim().optional().default(""),
  solution: z.string().trim().optional().default(""),
  status: z.enum(["DRAFT", "SUBMITTED"]).default("SUBMITTED"),
  note: z.string().trim().optional().default(""),
});

export const updateInternshipLogSchema = createInternshipLogSchema.partial();

export const rejectInternshipLogSchema = z.object({
  note: z.string().trim().min(1),
});
