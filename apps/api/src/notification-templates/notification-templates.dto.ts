import { z } from "zod";

export const notificationTemplateListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  channel: z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const createNotificationTemplateSchema = z.object({
  code: z.string().trim().min(2),
  name: z.string().trim().min(2),
  channel: z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]).default("IN_APP"),
  subject: z.string().trim().optional().default(""),
  body: z.string().trim().min(2),
  isActive: z.coerce.boolean().default(true),
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();
