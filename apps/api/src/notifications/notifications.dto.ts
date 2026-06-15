import { z } from "zod";

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["UNREAD", "READ", "ARCHIVED"]).optional(),
  channel: z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]).optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1),
  title: z.string().trim().min(2),
  body: z.string().trim().min(2),
  channel: z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]).default("IN_APP"),
  metadata: z.unknown().optional(),
});
