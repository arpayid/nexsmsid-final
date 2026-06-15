import { z } from "zod";

import { publicJobApplySchema } from "../job-vacancies/job-vacancies.dto";

export const publicJobApplyBodySchema = publicJobApplySchema.extend({
  captchaToken: z.string().trim().optional(),
});

export const publicJobCvUploadBodySchema = z.object({
  uploadToken: z.string().min(10).optional(),
  captchaToken: z.string().trim().optional(),
});

export const publicJobCvTokenBodySchema = z.object({
  captchaToken: z.string().trim().optional(),
});
