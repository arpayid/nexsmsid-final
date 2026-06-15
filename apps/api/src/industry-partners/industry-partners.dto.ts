import { z } from "zod";

export const industryPartnerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createIndustryPartnerSchema = z.object({
  name: z.string().trim().min(2),
  type: z.string().trim().optional().default(""),
  contactPerson: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional().default(""),
  website: z.string().trim().optional().default(""),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  note: z.string().trim().optional().default(""),
});

export const updateIndustryPartnerSchema = createIndustryPartnerSchema.partial();
