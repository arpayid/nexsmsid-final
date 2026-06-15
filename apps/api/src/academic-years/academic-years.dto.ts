import { z } from "zod";

const academicYearShape = z.object({
  name: z.string().min(2).max(80),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(false),
});

const endAfterStart = (data: { startDate?: Date; endDate?: Date }) => !data.startDate || !data.endDate || data.endDate >= data.startDate;
const endAfterStartMessage = { message: "Tanggal selesai harus setelah tanggal mulai", path: ["endDate"] };

export const createAcademicYearSchema = academicYearShape.refine(endAfterStart, endAfterStartMessage);

export const updateAcademicYearSchema = academicYearShape.partial().refine(endAfterStart, endAfterStartMessage);
