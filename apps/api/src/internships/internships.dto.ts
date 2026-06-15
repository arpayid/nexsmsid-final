import { z } from "zod";

const score = z.coerce.number().min(0).max(100);

export const internshipsListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  studentId: z.string().trim().optional(),
  industryPartnerId: z.string().trim().optional(),
});

export const createInternshipSchema = z.object({
  studentId: z.string().trim().min(1),
  industryPartnerId: z.string().trim().min(1),
  supervisorTeacherId: z.string().trim().optional().default(""),
  title: z.string().trim().min(2),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"]).default("PLANNED"),
  note: z.string().trim().optional().default(""),
});

export const updateInternshipSchema = createInternshipSchema.partial();

export const internshipScoreSchema = z.object({
  disciplineScore: score,
  skillScore: score,
  attitudeScore: score,
  reportScore: score,
  note: z.string().trim().optional().default(""),
});
