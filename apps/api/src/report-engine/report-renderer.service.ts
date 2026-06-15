import { Injectable, Inject } from "@nestjs/common";
import { ExcelService } from "../excel/excel.service";
import { PdfService } from "../pdf/pdf.service";
import { ReportDataResult } from "./report-engine.types";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class ReportRendererService {
  private readonly storagePath = path.join(process.cwd(), "storage", "reports");

  constructor(
    @Inject(ExcelService) private readonly excelService: ExcelService,
    @Inject(PdfService) private readonly pdfService: PdfService,
  ) {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async render(data: ReportDataResult, format: "XLSX" | "PDF" | "CSV" | "JSON", fileName: string): Promise<string> {
    const fullPath = path.join(this.storagePath, fileName);

    switch (format) {
      case "XLSX":
        await this.renderExcel(data, fullPath);
        break;
      case "CSV":
        await this.renderCsv(data, fullPath);
        break;
      case "PDF":
        await this.renderPdf(data, fullPath);
        break;
      case "JSON":
        await this.renderJson(data, fullPath);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return fullPath;
  }

  private async renderExcel(data: ReportDataResult, filePath: string) {
    const buffer = await this.excelService.recordsToWorkbookBuffer(
      data.title,
      data.columns.map((c) => ({ key: c.key, header: c.label, width: c.width })),
      data.rows,
    );
    fs.writeFileSync(filePath, buffer);
  }

  private async renderCsv(data: ReportDataResult, filePath: string) {
    const headers = data.columns.map((c) => `"${c.label}"`).join(",");
    const rows = data.rows.map((row) =>
      data.columns
        .map((c) => {
          const val = row[c.key];
          return val === null || val === undefined ? '""' : `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const content = [headers, ...rows].join("\n");
    fs.writeFileSync(filePath, content);
  }

  private async renderJson(data: ReportDataResult, filePath: string) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  private async renderPdf(data: ReportDataResult, filePath: string) {
    // Basic PDF rendering using PdfService if possible, or simple table
    // For now, let's use a simple approach since PdfService might be complex
    const doc = await this.pdfService.createDocument({
      info: { Title: data.title },
    });

    doc.fontSize(18).text(data.title, { align: "center" });
    if (data.subtitle) {
      doc.fontSize(12).text(data.subtitle, { align: "center" });
    }
    doc.moveDown();

    // Very simple table representation in PDF
    const startX = 50;
    let currentY = doc.y;

    // Headers
    doc.fontSize(10).font("Helvetica-Bold");
    let currentX = startX;
    data.columns.forEach((col) => {
      doc.text(col.label, currentX, currentY, { width: (col.width || 10) * 5 });
      currentX += (col.width || 10) * 5 + 10;
    });
    currentY += 20;

    // Rows
    doc.font("Helvetica");
    data.rows.slice(0, 100).forEach((row) => {
      // Limit for safety
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      currentX = startX;
      data.columns.forEach((col) => {
        doc.text(String(row[col.key] || "-"), currentX, currentY, { width: (col.width || 10) * 5 });
        currentX += (col.width || 10) * 5 + 10;
      });
      currentY += 15;
    });

    const buffer = await this.pdfService.bufferFromDocument(doc);
    fs.writeFileSync(filePath, buffer);
  }
}
