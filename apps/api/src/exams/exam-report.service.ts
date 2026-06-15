import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as ExcelJS from "exceljs";

import { AuthenticatedUser, RequestWithUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { PdfService } from "../pdf/pdf.service";

type ExamReportData = Prisma.ExamGetPayload<{
  include: {
    examType: true;
    academicYear: true;
    participants: {
      where: { deletedAt: null };
      include: { student: { include: { user: { select: { id: true; name: true } } } } };
      orderBy: { number: "asc" };
    };
  };
}>;

@Injectable()
export class ExamReportService {
  constructor(
    @Inject(PdfService) private readonly pdf: PdfService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getSummary() {
    const [totalExams, byStatus, byType] = await Promise.all([
      this.prisma.exam.count({ where: { deletedAt: null } }),
      this.prisma.exam.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
      this.prisma.exam.groupBy({ by: ["examTypeId"], where: { deletedAt: null }, _count: true }),
    ]);

    const typeNames = await this.prisma.examType.findMany({ select: { id: true, name: true } });
    const typeMap = Object.fromEntries(typeNames.map((t) => [t.id, t.name]));

    return {
      totalExams,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byType: Object.fromEntries(byType.map((t) => [typeMap[t.examTypeId] ?? t.examTypeId, t._count])),
    };
  }

  async generateExamReport(
    examId: string,
    format: string,
    user: AuthenticatedUser,
    request: RequestWithUser,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, deletedAt: null },
      include: {
        examType: true,
        academicYear: true,
        participants: {
          where: { deletedAt: null },
          include: { student: { include: { user: { select: { id: true, name: true } } } } },
          orderBy: { number: "asc" },
        },
      },
    });
    if (!exam) throw new NotFoundException("Exam not found");

    if (format === "pdf") {
      return this.generatePdfReport(exam);
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Exam Report");
    ws.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Peserta", key: "name", width: 30 },
      { header: "Nomor Peserta", key: "number", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Skor", key: "score", width: 10 },
    ];

    exam.participants.forEach((p, i: number) => {
      ws.addRow({
        no: i + 1,
        name: p.student.user?.name ?? "-",
        number: p.number ?? "-",
        status: p.status,
        score: p.score ?? "-",
      });
    });

    ws.getRow(1).font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `exam-report-${exam.code}.xlsx`,
    };
  }

  private async generatePdfReport(exam: ExamReportData): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const header = { ...(await this.pdf.getSchoolHeader()), title: `Laporan Ujian: ${exam.name}` };

    const buffer = await this.pdf.render(header, (doc) => {
      this.pdf.drawSectionTitle(doc, exam.name);

      const items = [
        { label: "Kode", value: exam.code },
        { label: "Tipe", value: exam.examType.name },
        { label: "Tahun Akademik", value: exam.academicYear.name },
        { label: "Peserta", value: `${exam.participants.length} orang` },
        { label: "Durasi", value: `${exam.duration} menit` },
        { label: "Status", value: exam.status },
      ];
      this.pdf.drawKeyValueBlock(doc, items, 2);

      const columns = [
        { header: "No", width: 30 },
        { header: "Nama", width: 200 },
        { header: "No. Peserta", width: 80 },
        { header: "Status", width: 80 },
        { header: "Skor", width: 60 },
      ];
      const rows = exam.participants.map((p, i: number) => ({
        cells: [
          { text: i + 1, align: "center" } as const,
          { text: p.student.user?.name ?? "-" },
          { text: p.number ?? "-", align: "center" } as const,
          { text: p.status, align: "center" } as const,
          { text: p.score ?? "-", align: "right" } as const,
        ],
      }));
      this.pdf.drawTable(doc, columns, rows);
    });

    return { buffer, contentType: "application/pdf", filename: `exam-report-${exam.code}.pdf` };
  }
}
