import { z } from "zod";

export const tracerStudyListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "WORKING", "STUDYING", "ENTREPRENEUR", "UNEMPLOYED", "UNKNOWN"]).optional(),
  year: z.coerce.number().int().optional(),
});

export const createTracerStudySchema = z.object({
  alumniId: z.string().trim().min(1),
  year: z.coerce.number().int().min(1900),
  status: z.enum(["ACTIVE", "WORKING", "STUDYING", "ENTREPRENEUR", "UNEMPLOYED", "UNKNOWN"]).default("UNKNOWN"),
  companyName: z.string().trim().optional().default(""),
  position: z.string().trim().optional().default(""),
  university: z.string().trim().optional().default(""),
  major: z.string().trim().optional().default(""),
  businessName: z.string().trim().optional().default(""),
  incomeRange: z.string().trim().optional().default(""),
  feedback: z.string().trim().optional().default(""),
});

export const updateTracerStudySchema = createTracerStudySchema.partial();
