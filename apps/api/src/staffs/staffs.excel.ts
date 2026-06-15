import { ExcelColumn, ImportError } from "../excel/excel.types";
import { ResourceImportConfig } from "../excel/excel-import.service";
import { createStaffSchema } from "./staffs.dto";
import { StaffsService } from "./staffs.service";

export const staffsExcelColumns: ExcelColumn[] = [
  { header: "nip", key: "nip", width: 22, example: "198501012010011001" },
  { header: "name", key: "name", width: 32, required: true, example: "Budi Santoso" },
  { header: "gender", key: "gender", width: 12, required: true, example: "MALE" },
  { header: "phone", key: "phone", width: 18, example: "08123456789" },
  { header: "email", key: "email", width: 24, example: "budi@example.com" },
  { header: "address", key: "address", width: 32, example: "Jl. Kebon Jeruk No.3" },
  { header: "position", key: "position", width: 22, required: true, example: "Operator TU" },
  { header: "department", key: "department", width: 22, example: "Tata Usaha" },
  { header: "employmentStatus", key: "employmentStatus", width: 20, example: "PERMANENT" },
  { header: "status", key: "status", width: 14, example: "ACTIVE" },
  { header: "photoUrl", key: "photoUrl", width: 28, example: "https://example.com/photo.jpg" },
];

export function getStaffsImportConfig(service: StaffsService): ResourceImportConfig {
  return {
    resourceLabel: "Staffs",
    auditEntity: "staff",
    auditAction: "staff.import",
    columns: staffsExcelColumns,
    exampleData: {},
    validateRow(record) {
      const errors: ImportError[] = [];
      const data: Record<string, unknown> = { ...record };
      const parsed = createStaffSchema.safeParse(data);
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
      if (typeof record.nip === "string" && record.nip) conditions.push({ nip: record.nip });
      if (typeof record.email === "string" && record.email) conditions.push({ email: record.email });
      if (conditions.length === 0) return { ok: true };
      const existing = await service.findUniqueStaff(conditions);
      if (existing) return { ok: false, message: "NIP or email already exists" };
      return { ok: true };
    },
    async create(record) {
      return service.createRaw(record);
    },
  };
}
