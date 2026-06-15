import { z } from "zod";

export const reportJobListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  type: z.string().trim().optional(),
});

export const generateReportSchema = z.object({
  type: z.string().trim().min(2),
  title: z.string().trim().optional(),
  format: z.enum(["CSV", "XLSX", "PDF", "JSON"]).default("CSV"),
  parameters: z.unknown().optional(),
});
