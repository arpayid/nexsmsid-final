import { z } from "zod";

export const messageListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["SENT", "READ", "DELETED"]).optional(),
});

export const sendMessageSchema = z.object({
  recipientId: z.string().trim().min(1),
  subject: z.string().trim().min(2),
  body: z.string().trim().min(2),
});
