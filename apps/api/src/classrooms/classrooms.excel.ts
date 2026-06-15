import { z } from "zod";

import { ExcelColumn, ImportError } from "../excel/excel.types";
import { ResourceImportConfig } from "../excel/excel-import.service";
import { ClassroomsService } from "./classrooms.service";
import { createClassroomSchema } from "./classrooms.dto";

const importClassroomSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(30)
    .transform((value) => value.toUpperCase()),
  name: z.string().min(2).max(120),
  level: z.coerce.number().int().min(1).max(12),
  isActive: z.boolean().default(true),
});

export const classroomsExcelColumns: ExcelColumn[] = [
  { header: "competencyCode", key: "competencyCode", width: 20, required: true, example: "TKJ" },
  { header: "code", key: "code", width: 18, required: true, example: "X-TKJ-1" },
  { header: "name", key: "name", width: 28, required: true, example: "X TKJ 1" },
  { header: "level", key: "level", width: 12, required: true, example: "10" },
  { header: "isActive", key: "isActive", width: 14, example: "true" },
];

export function getClassroomsImportConfig(service: ClassroomsService): ResourceImportConfig {
  return {
    resourceLabel: "Classrooms",
    auditEntity: "classroom",
    auditAction: "master-data.import",
    columns: classroomsExcelColumns,
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

      const competencyCode = data.competencyCode;
      const competencyCodeValid = typeof competencyCode === "string" && competencyCode.trim() !== "";
      if (!competencyCodeValid) {
        errors.push({ field: "competencyCode", message: "is required" });
      }

      const payload: Record<string, unknown> = {
        code: data.code,
        name: data.name,
        level: data.level,
        isActive: data.isActive ?? true,
      };

      const parsed = importClassroomSchema.safeParse(payload);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push({ field: issue.path.join(".") || "row", message: issue.message });
        }
      }

      if (errors.length > 0) {
        return { ok: false, errors };
      }

      const result: Record<string, unknown> = { ...(parsed.data as Record<string, unknown>) };
      if (competencyCodeValid) {
        result.__competencyCode = competencyCode;
      }
      return { ok: true, data: result };
    },
    async isUnique(record) {
      const existing = await service.findUniqueClassroom(String(record.code));
      if (existing) return { ok: false, message: "Classroom code already exists" };
      return { ok: true };
    },
    async transform(record) {
      const data: Record<string, unknown> = { ...record };
      const code = data.__competencyCode;
      delete data.__competencyCode;
      if (!code || typeof code !== "string") {
        throw new Error("competencyCode is required");
      }
      const competencyId = await service.findCompetencyIdByCode(code);
      if (!competencyId) {
        throw new Error(`Competency with code '${code}' not found`);
      }
      data.competencyId = competencyId;
      return data;
    },
    async create(record) {
      return service.createRaw(record);
    },
  };
}
