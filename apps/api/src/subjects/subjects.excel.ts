import { ExcelColumn, ImportError } from "../excel/excel.types";
import { ResourceImportConfig } from "../excel/excel-import.service";
import { createSubjectSchema } from "./subjects.dto";
import { SubjectsService } from "./subjects.service";

export const subjectsExcelColumns: ExcelColumn[] = [
  { header: "code", key: "code", width: 16, required: true, example: "MTK" },
  { header: "name", key: "name", width: 28, required: true, example: "Matematika" },
  { header: "group", key: "group", width: 18, example: "A" },
  { header: "isActive", key: "isActive", width: 14, example: "true" },
];

export function getSubjectsImportConfig(service: SubjectsService): ResourceImportConfig {
  return {
    resourceLabel: "Subjects",
    auditEntity: "subject",
    auditAction: "master-data.import",
    columns: subjectsExcelColumns,
    exampleData: {},
    validateRow(record) {
      const errors: ImportError[] = [];
      const data: Record<string, unknown> = { ...record };

      if (typeof data.isActive === "string") {
        const normalized = data.isActive.toString().trim().toLowerCase();
        if (["true", "1", "yes", "y"].includes(normalized)) {
          data.isActive = true;
        } else if (["false", "0", "no", "n"].includes(normalized)) {
          data.isActive = false;
        } else {
          errors.push({ field: "isActive", message: "must be true or false" });
        }
      }

      const parsed = createSubjectSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({ field: issue.path.join(".") || "row", message: issue.message });
        }
        return { ok: false, errors };
      }
      return { ok: true, data: parsed.data };
    },
    async isUnique(record) {
      const existing = await service.findUniqueSubject(String(record.code));
      if (existing) return { ok: false, message: "Subject code already exists" };
      return { ok: true };
    },
    async create(record) {
      return service.createRaw(record);
    },
  };
}
