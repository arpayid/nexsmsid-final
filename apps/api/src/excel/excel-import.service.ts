import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { AuditService } from "../audit/audit.service";
import { AuthenticatedUser, RequestMeta } from "../auth/auth.types";
import { validateSpreadsheetMagicBytes } from "../common/upload";
import { ExcelColumn } from "./excel.types";
import { ExcelService } from "./excel.service";
import { ImportError, ImportResult } from "./excel.types";

export type ResourceImportConfig = {
  resourceLabel: string;
  auditEntity: string;
  auditAction: string;
  columns: ExcelColumn[];
  exampleData: Record<string, unknown>;
  transform?: (
    record: Record<string, unknown>,
    rowNumber: number,
    errors: ImportError[],
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  validateRow: (record: Record<string, unknown>) => { ok: true; data: Record<string, unknown> } | { ok: false; errors: ImportError[] };
  isUnique: (record: Record<string, unknown>) => Promise<{ ok: true } | { ok: false; message: string }>;
  create: (record: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

@Injectable()
export class ExcelImportService {
  private readonly logger = new Logger(ExcelImportService.name);

  constructor(
    @Inject(ExcelService) private readonly excelService: ExcelService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async buildTemplate(config: ResourceImportConfig): Promise<Buffer> {
    return this.excelService.buildTemplateWorkbook(config.resourceLabel, [
      ...config.columns,
      { header: "Example", key: "__example__", width: 1, example: "see row below" },
    ]);
  }

  async importFromBuffer(
    config: ResourceImportConfig,
    buffer: Buffer,
    actor: AuthenticatedUser,
    meta: RequestMeta,
    originalname?: string,
  ): Promise<ImportResult> {
    validateSpreadsheetMagicBytes(buffer, originalname);

    const rows = await this.excelService.parseWorkbook(buffer);
    const totalRows = rows.length;
    const errors: ImportError[] = [];
    let successRows = 0;
    let failedRows = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const record = rows[i];
      const rowNumber = i + 2;

      try {
        const validation = config.validateRow(record);

        if (!validation.ok) {
          for (const err of validation.errors) {
            errors.push({ ...err, row: rowNumber });
          }
          failedRows += 1;
          continue;
        }

        const unique = await config.isUnique(validation.data);

        if (!unique.ok) {
          errors.push({ row: rowNumber, field: "unique", message: unique.message });
          failedRows += 1;
          continue;
        }

        const transformed = config.transform ? await config.transform(validation.data, rowNumber, errors) : validation.data;

        const created = await config.create(transformed);

        await this.auditService.record({
          ...meta,
          actorId: actor.id,
          action: config.auditAction,
          entity: config.auditEntity,
          entityId: String((created as { id?: string | number }).id ?? ""),
          metadata: { row: rowNumber },
        });

        successRows += 1;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          errors.push({
            row: rowNumber,
            field: "unique",
            message: "Unique field already exists",
          });
        } else {
          const detail = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Import row ${rowNumber} failed: ${detail}`);
          errors.push({ row: rowNumber, message: "Failed to import row" });
        }
        failedRows += 1;
      }
    }

    return {
      totalRows,
      successRows,
      failedRows,
      errors,
    };
  }

  async exportRows(config: ResourceImportConfig, records: Record<string, unknown>[]): Promise<Buffer> {
    return this.excelService.recordsToWorkbookBuffer(config.resourceLabel, config.columns, records);
  }
}

export type { ResourceImportConfig as ExcelResourceConfig };
