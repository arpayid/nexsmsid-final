import { z } from "zod";

export const alumniListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "WORKING", "STUDYING", "ENTREPRENEUR", "UNEMPLOYED", "UNKNOWN"]).optional(),
  graduationYear: z.coerce.number().int().optional(),
});

export const createAlumniSchema = z.object({
  studentId: z.string().trim().optional().default(""),
  nis: z.string().trim().optional().default(""),
  name: z.string().trim().min(2),
  graduationYear: z.coerce.number().int().min(1900),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional().default(""),
  status: z.enum(["ACTIVE", "WORKING", "STUDYING", "ENTREPRENEUR", "UNEMPLOYED", "UNKNOWN"]).default("UNKNOWN"),
  currentCompany: z.string().trim().optional().default(""),
  currentPosition: z.string().trim().optional().default(""),
  university: z.string().trim().optional().default(""),
  businessName: z.string().trim().optional().default(""),
});

export const updateAlumniSchema = createAlumniSchema.partial();
