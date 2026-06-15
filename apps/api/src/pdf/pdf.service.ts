import { Inject, Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";

import { PrismaService } from "../database/prisma.service";
import { PdfHeader, PdfKeyValue, PdfTableColumn, PdfTableRow } from "./pdf.types";

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

@Injectable()
export class PdfService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private formatCurrency(value: unknown): string {
    if (value === null || value === undefined) return "-";
    const num = typeof value === "number" ? value : Number(value.toString());
    if (Number.isNaN(num)) return String(value);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  }

  private formatDate(value: unknown): string {
    if (!value) return "-";
    const d = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  }

  private formatDateTime(value: unknown): string {
    if (!value) return "-";
    const d = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async getSchoolHeader() {
    const profile = await this.prisma.schoolProfile.findFirst({ orderBy: { createdAt: "asc" } });
    if (profile) {
      return {
        schoolName: profile.name,
        schoolAddress: profile.address,
        schoolPhone: profile.phone,
        schoolEmail: profile.email,
      };
    }
    return {
      schoolName: "NexSMSID School",
      schoolAddress: null,
      schoolPhone: null,
      schoolEmail: null,
    };
  }

  createDocument(options: { info?: { Title?: string; Author?: string } } = {}): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN },
      info: {
        Title: options.info?.Title || "Document",
        Author: options.info?.Author || "NexSMSID",
      },
    });
    return doc;
  }

  async bufferFromDocument(doc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));
      doc.end();
    });
  }

  async render(header: PdfHeader, renderContent: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    const doc = this.createDocument({ info: { Title: header.title, Author: header.schoolName } });

    this.drawHeader(doc, header);
    doc.moveDown(1.5);

    renderContent(doc);

    return this.bufferFromDocument(doc);
  }

  private drawHeader(doc: PDFKit.PDFDocument, header: PdfHeader) {
    const titleFontSize = 14;
    const orgFontSize = 13;

    doc.font("Helvetica-Bold").fontSize(orgFontSize).text(header.schoolName, { align: "center" });

    doc.font("Helvetica").fontSize(9).fillColor("#444");
    const subLines: string[] = [];
    if (header.schoolAddress) subLines.push(header.schoolAddress);
    const contact: string[] = [];
    if (header.schoolPhone) contact.push(`Telp: ${header.schoolPhone}`);
    if (header.schoolEmail) contact.push(header.schoolEmail);
    if (contact.length) subLines.push(contact.join(" • "));
    if (subLines.length) {
      doc.text(subLines.join("\n"), { align: "center" });
    }
    doc.fillColor("black");

    doc.moveDown(0.3);
    const dividerY = doc.y;
    doc
      .moveTo(PAGE_MARGIN, dividerY)
      .lineTo(PAGE_WIDTH - PAGE_MARGIN, dividerY)
      .lineWidth(1.2)
      .strokeColor("#333")
      .stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").fontSize(titleFontSize).text(header.title, { align: "center" });
    doc.font("Helvetica").fontSize(9).fillColor("#555");

    if (header.documentNumber) {
      doc.text(`No. ${header.documentNumber}`, { align: "center" });
    }
    const printedAt = header.printedAt ?? new Date();
    doc.text(`Dicetak: ${this.formatDateTime(printedAt)}`, { align: "center" });
    doc.fillColor("black");
    doc.moveDown(0.3);

    const sepY = doc.y;
    doc
      .moveTo(PAGE_MARGIN, sepY)
      .lineTo(PAGE_WIDTH - PAGE_MARGIN, sepY)
      .lineWidth(0.5)
      .strokeColor("#999")
      .stroke();
  }

  drawKeyValueBlock(doc: PDFKit.PDFDocument, items: PdfKeyValue[], columns = 2) {
    const colWidth = CONTENT_WIDTH / columns;
    const startY = doc.y;
    let maxRowHeight = 0;
    let col = 0;

    doc.font("Helvetica").fontSize(9);
    const drawRow = (y: number) => {
      doc
        .moveTo(PAGE_MARGIN, y)
        .lineTo(PAGE_WIDTH - PAGE_MARGIN, y)
        .lineWidth(0.4)
        .strokeColor("#ddd")
        .stroke();
    };

    for (const item of items) {
      if (col === 0) {
        drawRow(doc.y);
      }
      const x = PAGE_MARGIN + col * colWidth;
      const baseY = doc.y;
      doc.font("Helvetica-Bold").text(`${item.label}:`, x, baseY, { width: colWidth * 0.4 });
      doc.font("Helvetica").text(String(item.value ?? "-"), x + colWidth * 0.4, baseY, { width: colWidth * 0.58 });
      const endY = doc.y;
      if (endY - startY > maxRowHeight) maxRowHeight = endY - startY;
      col = (col + 1) % columns;
      if (col === 0) {
        doc.y = Math.max(doc.y, startY + 18);
      }
    }
    if (col !== 0) {
      doc.y = Math.max(doc.y, startY + 18);
    }
    drawRow(doc.y);
    doc.moveDown(0.5);
  }

  drawTable(doc: PDFKit.PDFDocument, columns: PdfTableColumn[], rows: PdfTableRow[], options: { minRowHeight?: number } = {}) {
    const minRowHeight = options.minRowHeight ?? 18;
    const totalWidth = columns.reduce((s, c) => s + c.width, 0);
    if (totalWidth > CONTENT_WIDTH) {
      const factor = CONTENT_WIDTH / totalWidth;
      for (const c of columns) c.width = c.width * factor;
    }

    const drawHeader = () => {
      const startX = PAGE_MARGIN;
      const startY = doc.y;
      doc.rect(startX, startY, CONTENT_WIDTH, 22).fillColor("#eef0f7").fill();
      doc.fillColor("black");
      let x = startX;
      doc.font("Helvetica-Bold").fontSize(9);
      for (const col of columns) {
        doc.text(col.header, x + 4, startY + 6, { width: col.width - 8, align: col.align ?? "left" });
        x += col.width;
      }
      doc.y = startY + 22;
    };

    const drawRow = (row: PdfTableRow) => {
      const startX = PAGE_MARGIN;
      const startY = doc.y;
      const widths: number[] = columns.map((c) => c.width);
      const cellHeights: number[] = columns.map((c, i) => {
        const text = String(row.cells[i]?.text ?? "");
        const width = widths[i] - 8;
        doc.font("Helvetica").fontSize(9);
        return Math.max(minRowHeight, doc.heightOfString(text, { width }));
      });
      const rowHeight = Math.max(...cellHeights, minRowHeight);

      if (startY + rowHeight > PAGE_HEIGHT - PAGE_MARGIN - 30) {
        doc.addPage();
      }
      const currentY = doc.y;
      doc.rect(startX, currentY, CONTENT_WIDTH, rowHeight).fillColor("white").fill();
      doc.rect(startX, currentY, CONTENT_WIDTH, rowHeight).strokeColor("#e1e4ed").lineWidth(0.5).stroke();
      let x = startX;
      doc.font("Helvetica").fontSize(9).fillColor("black");
      for (let i = 0; i < columns.length; i += 1) {
        const col = columns[i];
        const text = String(row.cells[i]?.text ?? "");
        const align = row.cells[i]?.align ?? col.align ?? "left";
        doc.text(text, x + 4, currentY + 5, { width: col.width - 8, align });
        x += col.width;
      }
      doc.y = currentY + rowHeight;
    };

    drawHeader();
    for (const row of rows) {
      drawRow(row);
    }
    doc.moveDown(0.5);
  }

  drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
    doc.font("Helvetica-Bold").fontSize(11).text(title);
    doc.moveDown(0.3);
  }

  drawText(doc: PDFKit.PDFDocument, text: string, options: { bold?: boolean; size?: number; align?: "left" | "right" | "center" } = {}) {
    const font = options.bold ? "Helvetica-Bold" : "Helvetica";
    doc.font(font).fontSize(options.size ?? 10);
    doc.text(text, { align: options.align ?? "left" });
  }

  drawDivider(doc: PDFKit.PDFDocument) {
    const y = doc.y;
    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(PAGE_WIDTH - PAGE_MARGIN, y)
      .lineWidth(0.5)
      .strokeColor("#999")
      .stroke();
    doc.moveDown(0.3);
  }

  drawSignatureBlock(doc: PDFKit.PDFDocument, city: string, signerRole: string, signerName?: string | null) {
    if (doc.y > PAGE_HEIGHT - 150) {
      doc.addPage();
    }
    const rightX = PAGE_WIDTH - PAGE_MARGIN - 200;
    const dateStr = `${city || "Tempat"}, ${this.formatDate(new Date())}`;
    doc.font("Helvetica").fontSize(10);
    doc.text(dateStr, rightX, doc.y, { width: 200, align: "center" });
    doc.text(signerRole, rightX, doc.y, { width: 200, align: "center" });
    doc.moveDown(2.5);
    doc.text(signerName || "( ___________________ )", rightX, doc.y, { width: 200, align: "center" });
  }
}
