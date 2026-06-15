import { z } from "zod";

export const exportHistoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  format: z.enum(["CSV", "XLSX", "PDF", "JSON"]).optional(),
});
