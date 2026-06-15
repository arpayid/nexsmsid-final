import { z } from "zod";

export const createInvoiceSchema = z.object({
  studentId: z.string().trim().min(1),
  academicYearId: z.string().trim().optional().default(""),
  semesterId: z.string().trim().optional().default(""),
  dueDate: z.coerce.date().optional(),
  discount: z.coerce.number().min(0).default(0),
  penalty: z.coerce.number().min(0).default(0),
  note: z.string().trim().optional().default(""),
  items: z
    .array(
      z.object({
        paymentCategoryId: z.string().trim().optional().default(""),
        name: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).default(1),
        unitPrice: z.coerce.number().min(0),
      }),
    )
    .min(1),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.coerce.date().optional(),
  discount: z.coerce.number().min(0).optional(),
  penalty: z.coerce.number().min(0).optional(),
  note: z.string().trim().optional(),
});
