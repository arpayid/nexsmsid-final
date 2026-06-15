import { Injectable, NotFoundException } from "@nestjs/common";
import { PdfService } from "../pdf/pdf.service";
import { InventoryService } from "./inventory.service";
import { PdfHeader } from "../pdf/pdf.types";

@Injectable()
export class InventoryPdfService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly inventoryService: InventoryService,
  ) {}

  async generateItemPdf(itemId: string): Promise<Buffer> {
    const item = await this.inventoryService.getItem(itemId);
    const schoolHeader = await this.pdfService.getSchoolHeader();

    const header: PdfHeader = {
      ...schoolHeader,
      title: "Data Barang Inventaris",
      documentNumber: `INV/${item.code}`,
    };

    return this.pdfService.render(header, (doc) => {
      this.pdfService.drawSectionTitle(doc, "Informasi Barang");
      this.pdfService.drawKeyValueBlock(doc, [
        { label: "Kode Barang", value: item.code },
        { label: "Nama Barang", value: item.name },
        { label: "Kategori", value: item.category.name },
        { label: "Lokasi", value: item.location?.name ?? "-" },
        { label: "Kondisi", value: item.condition },
        { label: "Status", value: item.status },
        { label: "Tanggal Beli", value: item.purchaseDate ? item.purchaseDate.toLocaleDateString("id-ID") : "-" },
        { label: "Harga Beli", value: item.purchasePrice ? `Rp ${item.purchasePrice}` : "-" },
        { label: "Penanggung Jawab", value: item.location?.responsibleUserId ?? "-" }, // Would be good to populate user name if available
      ]);

      doc.moveDown(1);
      this.pdfService.drawSignatureBlock(doc, "Jakarta", "Petugas Sarpras", null);
    });
  }

  async generateItemLabelPdf(itemId: string): Promise<Buffer> {
    const item = await this.inventoryService.getItem(itemId);
    const doc = this.pdfService.createDocument({ info: { Title: `Label ${item.code}` } });

    // Custom logic for label
    doc.font("Helvetica-Bold").fontSize(14).text("NEXSMSID SCHOOL", { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10).text(`Kode: ${item.code}`, { align: "center" });
    doc.text(`Nama: ${item.name}`, { align: "center" });
    doc.text(`Lokasi: ${item.location?.name ?? "-"}`, { align: "center" });
    if (item.qrCode || item.barcode) {
      doc.text(`QR/Barcode: ${item.qrCode || item.barcode}`, { align: "center" });
    }

    return this.pdfService.bufferFromDocument(doc);
  }

  async generateLoanPdf(loanId: string): Promise<Buffer> {
    const loan = await this.inventoryService.getLoan(loanId);
    const schoolHeader = await this.pdfService.getSchoolHeader();

    const header: PdfHeader = {
      ...schoolHeader,
      title: "Bukti Peminjaman Barang",
      documentNumber: `LOAN/${loan.id.slice(-6).toUpperCase()}`,
    };

    return this.pdfService.render(header, (doc) => {
      this.pdfService.drawSectionTitle(doc, "Data Peminjam");
      this.pdfService.drawKeyValueBlock(doc, [
        { label: "Nama", value: loan.borrowerName },
        { label: "Tipe", value: loan.borrowerType },
        { label: "Tujuan", value: loan.purpose },
        { label: "Status", value: loan.status },
      ]);

      this.pdfService.drawSectionTitle(doc, "Data Barang");
      this.pdfService.drawKeyValueBlock(doc, [
        { label: "Kode Barang", value: loan.item.code },
        { label: "Nama Barang", value: loan.item.name },
        { label: "Jumlah", value: String(loan.quantity) },
        { label: "Tgl Pinjam", value: loan.borrowedAt ? loan.borrowedAt.toLocaleDateString("id-ID") : "-" },
        { label: "Jatuh Tempo", value: loan.dueAt ? loan.dueAt.toLocaleDateString("id-ID") : "-" },
      ]);

      doc.moveDown(1);
      this.pdfService.drawSignatureBlock(doc, "Jakarta", "Peminjam", loan.borrowerName);
    });
  }

  async generateSummaryPdf(): Promise<Buffer> {
    const summary = await this.inventoryService.getSummary();
    const schoolHeader = await this.pdfService.getSchoolHeader();

    const header: PdfHeader = {
      ...schoolHeader,
      title: "Ringkasan Inventaris Sarpras",
      documentNumber: `SUM/${new Date().getFullYear()}/${new Date().getMonth() + 1}`,
    };

    return this.pdfService.render(header, (doc) => {
      this.pdfService.drawSectionTitle(doc, "Statistik Utama");
      this.pdfService.drawKeyValueBlock(doc, [
        { label: "Total Item", value: String(summary.totalItems) },
        { label: "Aset Aktif", value: String(summary.activeAssets) },
        { label: "Aset Rusak", value: String(summary.damagedAssets) },
        { label: "Dalam Pemeliharaan", value: String(summary.inMaintenance) },
        { label: "Sedang Dipinjam", value: String(summary.borrowedLoans) },
        { label: "Stok Menipis", value: String(summary.lowStockItems) },
      ]);
    });
  }
}
