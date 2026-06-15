import { z } from "zod";

import { ExcelColumn, ImportError } from "../excel/excel.types";
import { ResourceImportConfig } from "../excel/excel-import.service";
import { createStudentSchema } from "./students.dto";
import { StudentsService } from "./students.service";

const importStudentSchema = createStudentSchema.extend({
  classroomCode: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value === "" || value === null ? null : value)),
});

export const studentsExcelColumns: ExcelColumn[] = [
  { header: "nis", key: "nis", width: 18, required: true, example: "2026001" },
  { header: "nisn", key: "nisn", width: 18, example: "1234567890" },
  { header: "name", key: "name", width: 32, required: true, example: "Ahmad Fauzi" },
  { header: "gender", key: "gender", width: 14, required: true, example: "MALE" },
  { header: "birthPlace", key: "birthPlace", width: 18, example: "Bandung" },
  { header: "birthDate", key: "birthDate", width: 18, example: "2008-05-12" },
  { header: "address", key: "address", width: 32, example: "Jl. Merdeka No.1" },
  { header: "phone", key: "phone", width: 18, example: "08123456789" },
  { header: "email", key: "email", width: 24, example: "ahmad@example.com" },
  { header: "classroomCode", key: "classroomCode", width: 18, example: "X-TKJ-1" },
  { header: "status", key: "status", width: 14, example: "ACTIVE" },
  { header: "enrolledAt", key: "enrolledAt", width: 18, example: "2024-07-15" },
  { header: "photoUrl", key: "photoUrl", width: 28, example: "https://example.com/photo.jpg" },
];

export function getStudentsImportConfig(service: StudentsService): ResourceImportConfig {
  return {
    resourceLabel: "Students",
    auditEntity: "student",
    auditAction: "student.import",
    columns: studentsExcelColumns,
    exampleData: {},
    validateRow(record) {
      const errors: ImportError[] = [];
      const data: Record<string, unknown> = { ...record };

      const dateFields = ["birthDate", "enrolledAt"];

      for (const field of dateFields) {
        const value = data[field];
        if (value !== null && value !== undefined && value !== "") {
          if (typeof value !== "string") {
            errors.push({ field, message: "must be a string in YYYY-MM-DD format" });
            continue;
          }
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            errors.push({ field, message: "must be a valid date (YYYY-MM-DD)" });
          }
        }
      }

      const parsed = importStudentSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            field: issue.path.join(".") || "row",
            message: issue.message,
          });
        }
        return { ok: false, errors };
      }

      const { classroomCode, ...rest } = parsed.data;
      const payload: Record<string, unknown> = { ...rest };
      if (classroomCode && typeof classroomCode === "string") {
        payload.__classroomCode = classroomCode;
      }
      return { ok: true, data: payload };
    },
    async isUnique(record) {
      const prisma = (service as unknown as { prisma: { student: { findFirst: (args: unknown) => Promise<unknown> } } }).prisma;
      const data = record;

      const conditions: Array<Record<string, unknown>> = [];
      if (typeof data.nis === "string" && data.nis) {
        conditions.push({ nis: data.nis });
      }
      if (typeof data.nisn === "string" && data.nisn) {
        conditions.push({ nisn: data.nisn });
      }
      if (typeof data.email === "string" && data.email) {
        conditions.push({ email: data.email });
      }
      if (conditions.length === 0) {
        return { ok: true };
      }
      const existing = await prisma.student.findFirst({ where: { OR: conditions, deletedAt: null } });
      if (existing) {
        return { ok: false, message: "NIS, NISN, or email already exists" };
      }
      return { ok: true };
    },
    async transform(record) {
      const data: Record<string, unknown> = { ...record };
      const code = data.__classroomCode;
      delete data.__classroomCode;
      if (!code || typeof code !== "string") {
        data.classroomId = null;
        return data;
      }
      const classroom = await service.findClassroomIdByCode(code);
      if (!classroom) {
        throw new Error(`Classroom with code '${code}' not found`);
      }
      data.classroomId = classroom;
      return data;
    },
    async create(record) {
      return service.createRaw(record);
    },
  };
}
