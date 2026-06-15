import { ExcelColumn, ImportError } from "../excel/excel.types";
import { ResourceImportConfig } from "../excel/excel-import.service";
import { createGuardianSchema } from "./guardians.dto";
import { GuardiansService } from "./guardians.service";

export const guardiansExcelColumns: ExcelColumn[] = [
  { header: "name", key: "name", width: 32, required: true, example: "Joko Widodo" },
  { header: "relation", key: "relation", width: 16, required: true, example: "FATHER" },
  { header: "phone", key: "phone", width: 18, required: true, example: "08123456789" },
  { header: "email", key: "email", width: 24, example: "joko@example.com" },
  { header: "occupation", key: "occupation", width: 22, example: "Wiraswasta" },
  { header: "address", key: "address", width: 32, example: "Jl. Solo No.10" },
];

export function getGuardiansImportConfig(service: GuardiansService): ResourceImportConfig {
  return {
    resourceLabel: "Guardians",
    auditEntity: "guardian",
    auditAction: "guardian.import",
    columns: guardiansExcelColumns,
    exampleData: {},
    validateRow(record) {
      const errors: ImportError[] = [];
      const data: Record<string, unknown> = { ...record };
      const parsed = createGuardianSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({ field: issue.path.join(".") || "row", message: issue.message });
        }
        return { ok: false, errors };
      }
      return { ok: true, data: parsed.data };
    },
    async isUnique(record) {
      const conditions: Array<Record<string, unknown>> = [];
      if (typeof record.email === "string" && record.email) conditions.push({ email: record.email });
      if (conditions.length === 0) return { ok: true };
      const existing = await service.findUniqueGuardian(conditions);
      if (existing) return { ok: false, message: "Email already exists" };
      return { ok: true };
    },
    async create(record) {
      return service.createRaw(record);
    },
  };
}
