import { Inject, Injectable } from "@nestjs/common";

import { PdfService } from "../pdf/pdf.service";
import { PdfDocumentResult } from "../pdf/pdf.types";

type PrintableLetter = {
  id: string;
  letterNumber: string | null;
  subject: string;
  body: string;
  status: string;
  category: string;
  recipientName: string;
  recipientAddress: string | null;
  issuedAt: Date | null;
  createdAt: Date;
  createdBy?: { name: string } | null;
  approvedBy?: { name: string } | null;
};

@Injectable()
export class LetterPdfService {
  constructor(@Inject(PdfService) private readonly pdfService: PdfService) {}

  async build(letter: PrintableLetter): Promise<PdfDocumentResult> {
    const school = await this.pdfService.getSchoolHeader();
    const documentDate = letter.issuedAt ?? letter.createdAt;
    const buffer = await this.pdfService.render(
      {
        ...school,
        title: "SURAT SEKOLAH",
        documentNumber: letter.letterNumber ?? `PREVIEW-${letter.id}`,
        printedAt: new Date(),
      },
      (doc) => {
        if (letter.status !== "ISSUED") {
          doc.save();
          doc.rotate(-25, { origin: [300, 370] });
          doc.font("Helvetica-Bold").fontSize(56).fillColor("#dc2626").fillOpacity(0.12).text("DRAFT", 80, 350, { align: "center" });
          doc.restore();
          doc.fillOpacity(1).fillColor("black");
        }

        this.pdfService.drawKeyValueBlock(doc, [
          { label: "Nomor", value: letter.letterNumber ?? "Belum diterbitkan" },
          { label: "Tanggal", value: formatDate(documentDate) },
          { label: "Kategori", value: letter.category },
          { label: "Status", value: letter.status },
        ]);

        this.pdfService.drawSectionTitle(doc, "Tujuan Surat");
        this.pdfService.drawText(doc, `Kepada: ${letter.recipientName}`);
        if (letter.recipientAddress) this.pdfService.drawText(doc, letter.recipientAddress);
        doc.moveDown(0.6);

        this.pdfService.drawSectionTitle(doc, "Perihal");
        this.pdfService.drawText(doc, letter.subject, { bold: true });
        doc.moveDown(0.6);

        this.pdfService.drawSectionTitle(doc, "Isi Surat");
        doc.font("Helvetica").fontSize(10).text(letter.body, { align: "justify", lineGap: 4 });
        doc.moveDown(1);

        this.pdfService.drawDivider(doc);
        this.pdfService.drawText(doc, `Dibuat oleh: ${letter.createdBy?.name ?? "-"}`, { size: 9 });
        this.pdfService.drawText(doc, `Disetujui oleh: ${letter.approvedBy?.name ?? "-"}`, { size: 9 });
        doc.moveDown(1);
        this.pdfService.drawSignatureBlock(doc, "", "Kepala Sekolah/Petugas", letter.approvedBy?.name ?? null);
        doc.moveDown(0.5);
        this.pdfService.drawText(doc, "Dokumen ini dihasilkan oleh NexSMSID.", { align: "center", size: 8 });
      },
    );
    return { buffer, filename: `letter-${letter.letterNumber ?? letter.id}.pdf`, inline: true };
  }
}

function formatDate(value: Date) {
  return value.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}
