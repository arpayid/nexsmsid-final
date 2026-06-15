import { z } from "zod";

export const announcementListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  audience: z.enum(["ALL", "STUDENTS", "PARENTS", "TEACHERS", "STAFF"]).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2),
  content: z.string().trim().min(3),
  audience: z.enum(["ALL", "STUDENTS", "PARENTS", "TEACHERS", "STAFF"]).default("ALL"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();
