import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().trim().min(2),
  category: z.string().trim().min(1),
  amount: z.coerce.number().min(0.01),
  date: z.coerce.date().optional(),
  note: z.string().trim().optional().default(""),
});

export const updateExpenseSchema = z.object({
  title: z.string().trim().min(2).optional(),
  category: z.string().trim().min(1).optional(),
  amount: z.coerce.number().min(0.01).optional(),
  date: z.coerce.date().optional(),
  note: z.string().trim().optional(),
});
