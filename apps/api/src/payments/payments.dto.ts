import { z } from "zod";

import { safeFileUrlSchema } from "../common/safe-url";

export const createPaymentSchema = z.object({
  invoiceId: z.string().trim().min(1),
  amount: z.coerce.number().min(0.01),
  method: z.enum(["CASH", "BANK_TRANSFER", "QRIS", "OTHER"]).default("CASH"),
  paidAt: z.coerce.date().optional(),
  proofUrl: safeFileUrlSchema.optional().default(""),
  note: z.string().trim().optional().default(""),
});

export const updatePaymentSchema = z.object({
  method: z.enum(["CASH", "BANK_TRANSFER", "QRIS", "OTHER"]).optional(),
  paidAt: z.coerce.date().optional(),
  proofUrl: safeFileUrlSchema.optional(),
  note: z.string().trim().optional(),
});

export const verifyPaymentSchema = z.object({
  note: z.string().trim().optional().default(""),
});

export const rejectPaymentSchema = z.object({
  note: z.string().trim().min(1),
});
