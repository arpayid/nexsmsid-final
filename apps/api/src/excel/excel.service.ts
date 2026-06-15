import { Injectable } from "@nestjs/common";
import ExcelJS, { Workbook } from "exceljs";

import { ExcelColumn } from "./excel.types";

@Injectable()
export class ExcelService {
  async buildTemplateWorkbook(sheetName: string, columns: ExcelColumn[]): Promise<Buffer> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 22,
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();

    if (columns.some((col) => col.example !== undefined)) {
      const exampleRow: Record<string, unknown> = {};
      for (const col of columns) {
        if (col.example !== undefined) {
          exampleRow[col.key] = col.example;
        }
      }
      if (Object.keys(exampleRow).length > 0) {
        worksheet.addRow(exampleRow);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async parseWorkbook(buffer: Buffer): Promise<Record<string, unknown>[]> {
    const workbook = new Workbook();
    const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    await workbook.xlsx.load(nodeBuffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return [];
    }

    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      const value = cell.value;
      const text = typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value);
      headers[colNumber] = text;
    });

    const rows: Record<string, unknown>[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }
      const record: Record<string, unknown> = {};
      let hasValue = false;
      row.eachCell((cell, colNumber) => {
        const key = headers[colNumber];
        if (!key) {
          return;
        }
        if (cell.value === null || cell.value === undefined || cell.value === "") {
          record[key] = null;
          return;
        }
        if (cell.value instanceof Date) {
          record[key] = cell.value.toISOString();
          hasValue = true;
          return;
        }
        if (typeof cell.value === "object" && "result" in (cell.value as object)) {
          const formulaValue = (cell.value as { result: unknown }).result;
          record[key] = formulaValue ?? null;
          hasValue = hasValue || (formulaValue !== null && formulaValue !== undefined);
          return;
        }
        if (typeof cell.value === "object" && "text" in (cell.value as object)) {
          record[key] = (cell.value as { text: unknown }).text ?? null;
          hasValue = true;
          return;
        }
        if (typeof cell.value === "object" && "richText" in (cell.value as object)) {
          const rich = (cell.value as { richText: { text: string }[] }).richText;
          record[key] = rich.map((r) => r.text).join("");
          hasValue = true;
          return;
        }
        if (typeof cell.value === "boolean") {
          record[key] = cell.value;
          hasValue = true;
          return;
        }
        if (typeof cell.value === "number") {
          record[key] = cell.value;
          hasValue = true;
          return;
        }
        const textValue = String(cell.value).trim();
        record[key] = textValue === "" ? null : textValue;
        if (textValue !== "") {
          hasValue = true;
        }
      });
      if (hasValue) {
        rows.push(record);
      }
    });

    return rows;
  }

  async recordsToWorkbookBuffer(sheetName: string, columns: ExcelColumn[], records: Record<string, unknown>[]): Promise<Buffer> {
    const workbook: Workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 22,
    }));
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();

    for (const record of records) {
      const rowData: Record<string, unknown> = {};
      for (const col of columns) {
        rowData[col.key] = record[col.key] ?? null;
      }
      worksheet.addRow(rowData);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
