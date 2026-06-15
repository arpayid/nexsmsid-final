import { z } from "zod";

export const jobApplicationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["SUBMITTED", "REVIEWED", "INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
  jobVacancyId: z.string().trim().optional(),
});

export const updateJobApplicationSchema = z.object({
  applicantName: z.string().trim().min(2).optional(),
  applicantEmail: z.string().trim().email().optional().or(z.literal("")),
  applicantPhone: z.string().trim().optional(),
  cvUrl: z.string().trim().optional(),
  status: z.enum(["SUBMITTED", "REVIEWED", "INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
  note: z.string().trim().optional(),
});

export const jobApplicationNoteSchema = z.object({
  note: z.string().trim().optional().default(""),
});
