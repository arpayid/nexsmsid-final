import { z } from "zod";

const semesterShape = z.object({
  academicYearId: z.string().min(1),
  name: z.string().min(2).max(80),
  order: z.coerce.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(false),
});

const endAfterStart = (data: { startDate?: Date; endDate?: Date }) => !data.startDate || !data.endDate || data.endDate >= data.startDate;
const endAfterStartMessage = { message: "Tanggal selesai harus setelah tanggal mulai", path: ["endDate"] };

export const createSemesterSchema = semesterShape.refine(endAfterStart, endAfterStartMessage);

export const updateSemesterSchema = semesterShape.partial().refine(endAfterStart, endAfterStartMessage);
