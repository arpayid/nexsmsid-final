import { ExcelColumn, ImportError } from "../excel/excel.types";
import { ResourceImportConfig } from "../excel/excel-import.service";
import { createTeacherSchema } from "./teachers.dto";
import { TeachersService } from "./teachers.service";

export const teachersExcelColumns: ExcelColumn[] = [
  { header: "nip", key: "nip", width: 22, example: "198501012010011001" },
  { header: "nuptk", key: "nuptk", width: 22, example: "1234567890123456" },
  { header: "name", key: "name", width: 32, required: true, example: "Siti Aminah, S.Pd" },
  { header: "gender", key: "gender", width: 12, required: true, example: "FEMALE" },
  { header: "birthPlace", key: "birthPlace", width: 18, example: "Jakarta" },
  { header: "birthDate", key: "birthDate", width: 18, example: "1985-01-01" },
  { header: "phone", key: "phone", width: 18, example: "08123456789" },
  { header: "email", key: "email", width: 24, example: "siti@example.com" },
  { header: "address", key: "address", width: 32, example: "Jl. Pelajar No.5" },
  { header: "employmentStatus", key: "employmentStatus", width: 20, example: "PERMANENT" },
  { header: "status", key: "status", width: 14, example: "ACTIVE" },
  { header: "photoUrl", key: "photoUrl", width: 28, example: "https://example.com/photo.jpg" },
];

export function getTeachersImportConfig(service: TeachersService): ResourceImportConfig {
  return {
    resourceLabel: "Teachers",
    auditEntity: "teacher",
    auditAction: "teacher.import",
    columns: teachersExcelColumns,
    exampleData: {},
    validateRow(record) {
      const errors: ImportError[] = [];
      const data: Record<string, unknown> = { ...record };

      if (data.birthDate) {
        if (typeof data.birthDate !== "string" || Number.isNaN(new Date(data.birthDate).getTime())) {
          errors.push({ field: "birthDate", message: "must be a valid date (YYYY-MM-DD)" });
        }
      }

      const parsed = createTeacherSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({
            field: issue.path.join(".") || "row",
            message: issue.message,
          });
        }
        return { ok: false, errors };
      }
      return { ok: true, data: parsed.data };
    },
    async isUnique(record) {
      const conditions: Array<Record<string, unknown>> = [];
      if (typeof record.nip === "string" && record.nip) conditions.push({ nip: record.nip });
      if (typeof record.nuptk === "string" && record.nuptk) conditions.push({ nuptk: record.nuptk });
      if (typeof record.email === "string" && record.email) conditions.push({ email: record.email });
      if (conditions.length === 0) return { ok: true };
      const existing = await service.findUniqueTeacher(conditions);
      if (existing) return { ok: false, message: "NIP, NUPTK, or email already exists" };
      return { ok: true };
    },
    async create(record) {
      return service.createRaw(record);
    },
  };
}
