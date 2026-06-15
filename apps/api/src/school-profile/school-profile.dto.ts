import { z } from "zod";

export const updateSchoolProfileSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  npsn: z.string().max(32).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().url().nullable().optional(),
  principalName: z.string().max(120).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});
