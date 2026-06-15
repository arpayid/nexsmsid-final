import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { PdfService } from "../pdf/pdf.service";

@Injectable()
export class PayrollPdfService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  async generatePayslipPdf(payslipId: string): Promise<Buffer> {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        payrollRun: {
          include: {
            employee: { include: { position: true } },
            period: true,
            items: true,
          },
        },
      },
    });

    if (!payslip) throw new NotFoundException("Payslip not found");

    const run = payslip.payrollRun;
    const emp = run.employee;
    const period = run.period;

    const earnings = run.items.filter((i: any) => i.type === "EARNING");
    const deductions = run.items.filter((i: any) => i.type === "DEDUCTION");

    const header = await this.pdfService.getSchoolHeader();

    return this.pdfService.render(
      {
        ...header,
        title: "SLIP GAJI PEGAWAI",
        documentNumber: payslip.payslipNumber,
      },
      (doc) => {
        this.pdfService.drawKeyValueBlock(doc, [
          { label: "Nama Pegawai", value: emp.fullName },
          { label: "NIP / Kode", value: emp.employeeCode },
          { label: "Jabatan", value: emp.position?.name || "-" },
          { label: "Periode", value: `${period.name} (${period.month}/${period.year})` },
        ]);

        doc.moveDown(1);
        this.pdfService.drawSectionTitle(doc, "Penerimaan");
        this.pdfService.drawTable(
          doc,
          [
            { header: "Komponen", width: 300 },
            { header: "Jumlah", width: 200, align: "right" },
          ],
          [
            ...earnings.map((e: any) => ({
              cells: [{ text: e.name }, { text: Number(e.amount).toLocaleString("id-ID") }],
            })),
            {
              cells: [{ text: "Total Penerimaan", align: "left" }, { text: Number(run.totalEarnings).toLocaleString("id-ID") }],
            },
          ],
        );

        doc.moveDown(1);
        this.pdfService.drawSectionTitle(doc, "Potongan");
        this.pdfService.drawTable(
          doc,
          [
            { header: "Komponen", width: 300 },
            { header: "Jumlah", width: 200, align: "right" },
          ],
          [
            ...deductions.map((d: any) => ({
              cells: [{ text: d.name }, { text: Number(d.amount).toLocaleString("id-ID") }],
            })),
            {
              cells: [{ text: "Total Potongan", align: "left" }, { text: Number(run.totalDeductions).toLocaleString("id-ID") }],
            },
          ],
        );

        doc.moveDown(1);
        doc.font("Helvetica-Bold").fontSize(12);
        doc.text(`GAJI BERSIH: Rp ${Number(run.netAmount).toLocaleString("id-ID")}`, { align: "right" });
        doc.font("Helvetica").fontSize(10);

        this.pdfService.drawSignatureBlock(doc, "Jakarta", "Bagian Keuangan");
      },
    );
  }
}
