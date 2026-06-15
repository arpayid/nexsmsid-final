import { z } from "zod";

export const jobVacancyListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]).optional(),
});

export const createJobVacancySchema = z.object({
  industryPartnerId: z.string().trim().optional().default(""),
  title: z.string().trim().min(2),
  companyName: z.string().trim().min(2),
  description: z.string().trim().min(3),
  qualification: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  employmentType: z.string().trim().optional().default(""),
  salaryRange: z.string().trim().optional().default(""),
  deadline: z.coerce.date().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]).default("DRAFT"),
});

export const updateJobVacancySchema = createJobVacancySchema.partial();

export const publicJobApplySchema = z.object({
  alumniId: z.string().trim().optional().default(""),
  applicantName: z.string().trim().min(2),
  applicantEmail: z.string().trim().email().optional().or(z.literal("")),
  applicantPhone: z.string().trim().optional().default(""),
  cvUrl: z
    .string()
    .trim()
    .max(512)
    .optional()
    .default("")
    .refine((value) => value === "" || (value.startsWith("jobs/") && !value.includes("..")), {
      message: "cvUrl harus path CV yang valid",
    }),
  note: z.string().trim().optional().default(""),
});
