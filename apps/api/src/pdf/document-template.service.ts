import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceStatus, Gender, GradeStatus, PaymentMethod } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { PdfService } from "./pdf.service";
import { PdfHeader } from "./pdf.types";

@Injectable()
export class DocumentTemplateService {
  constructor(
    @Inject(PdfService) private readonly pdf: PdfService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  private header(title: string, documentNumber?: string | null): Promise<PdfHeader> {
    return (async () => {
      const school = await this.pdf.getSchoolHeader();
      return {
        schoolName: school.schoolName,
        schoolAddress: school.schoolAddress,
        schoolPhone: school.schoolPhone,
        schoolEmail: school.schoolEmail,
        title,
        documentNumber: documentNumber ?? null,
        printedAt: new Date(),
      };
    })();
  }

  private toIdr(amount: unknown): string {
    const num = amount === null || amount === undefined ? 0 : Number(amount.toString());
    if (Number.isNaN(num)) return "Rp0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  }

  private toDate(value: unknown): string {
    if (!value) return "-";
    const d = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  }

  private toDateTime(value: unknown): string {
    if (!value) return "-";
    const d = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private statusLabel(value: string | null | undefined, kind: "invoice" | "payment" | "ppdb"): string {
    if (!value) return "-";
    const lookup: Record<string, string> = {
      DRAFT: "Draf",
      ISSUED: "Diterbitkan",
      PARTIAL: "Sebagian Dibayar",
      PAID: "Lunas",
      OVERDUE: "Jatuh Tempo",
      CANCELLED: "Dibatalkan",
      PENDING: "Menunggu Verifikasi",
      VERIFIED: "Terverifikasi",
      REJECTED: "Ditolak",
      SUBMITTED: "Diajukan",
      REVISION: "Revisi",
      ACCEPTED: "Diterima",
      CONVERTED: "Terkonversi",
    };
    return lookup[value] ?? value;
  }

  private attendanceLabel(status: AttendanceStatus | string): string {
    const map: Record<string, string> = {
      PRESENT: "Hadir",
      ABSENT: "Alfa",
      LATE: "Terlambat",
      PERMIT: "Izin",
      SICK: "Sakit",
    };
    return map[status] ?? String(status);
  }

  private genderLabel(gender: Gender | string): string {
    return gender === "MALE" ? "Laki-laki" : gender === "FEMALE" ? "Perempuan" : String(gender);
  }

  private methodLabel(method: PaymentMethod | string): string {
    const map: Record<string, string> = {
      CASH: "Tunai",
      BANK_TRANSFER: "Transfer Bank",
      E_WALLET: "Dompet Digital",
      OTHER: "Lainnya",
    };
    return map[method] ?? String(method);
  }

  async renderInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null },
      include: {
        student: { include: { classroom: { include: { competency: true } } } },
        academicYear: true,
        semester: true,
        items: { include: { paymentCategory: true } },
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    const header = await this.header("INVOICE / TAGIHAN", invoice.invoiceNumber);
    return this.pdf.render(header, (doc) => {
      this.pdf.drawKeyValueBlock(doc, [
        { label: "Nomor Invoice", value: invoice.invoiceNumber },
        { label: "Tanggal", value: this.toDate(invoice.issueDate) },
        { label: "Jatuh Tempo", value: this.toDate(invoice.dueDate) },
        { label: "Status", value: this.statusLabel(invoice.status, "invoice") },
        { label: "Tahun Ajaran", value: invoice.academicYear?.name ?? "-" },
        { label: "Semester", value: invoice.semester?.name ?? "-" },
      ]);

      this.pdf.drawSectionTitle(doc, "Data Siswa");
      this.pdf.drawKeyValueBlock(doc, [
        { label: "Nama", value: invoice.student.name },
        { label: "NIS", value: invoice.student.nis },
        { label: "NISN", value: invoice.student.nisn ?? "-" },
        { label: "Kelas", value: invoice.student.classroom?.name ?? "-" },
        { label: "Jurusan", value: invoice.student.classroom?.competency?.name ?? "-" },
      ]);

      this.pdf.drawSectionTitle(doc, "Rincian Tagihan");
      this.pdf.drawTable(
        doc,
        [
          { header: "#", width: 30, align: "center" },
          { header: "Item", width: 240, align: "left" },
          { header: "Kategori", width: 100, align: "left" },
          { header: "Qty", width: 40, align: "right" },
          { header: "Harga Satuan", width: 80, align: "right" },
          { header: "Total", width: 80, align: "right" },
        ],
        invoice.items.length === 0
          ? [{ cells: [{ text: "Tidak ada item tagihan", align: "center" }] }]
          : invoice.items.map((item, idx) => ({
              cells: [
                { text: idx + 1, align: "center" },
                { text: item.name, align: "left" },
                { text: item.paymentCategory?.name ?? "-", align: "left" },
                { text: item.quantity, align: "right" },
                { text: this.toIdr(item.unitPrice), align: "right" },
                { text: this.toIdr(item.total), align: "right" },
              ],
            })),
        { minRowHeight: 18 },
      );

      const remaining = Number(invoice.total) - Number(invoice.paidAmount);
      this.pdf.drawKeyValueBlock(
        doc,
        [
          { label: "Subtotal", value: this.toIdr(invoice.subtotal) },
          { label: "Diskon", value: this.toIdr(invoice.discount) },
          { label: "Denda", value: this.toIdr(invoice.penalty) },
          { label: "Total", value: this.toIdr(invoice.total) },
          { label: "Sudah Dibayar", value: this.toIdr(invoice.paidAmount) },
          { label: "Sisa Tagihan", value: this.toIdr(remaining) },
        ],
        1,
      );

      if (invoice.note) {
        this.pdf.drawSectionTitle(doc, "Catatan");
        this.pdf.drawText(doc, invoice.note);
      }

      this.pdf.drawSignatureBlock(doc, invoice.student.classroom?.name || "Sekolah", "Bagian Keuangan");
    });
  }

  async renderPaymentReceiptPdf(paymentId: string): Promise<Buffer> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId },
      include: {
        invoice: { include: { student: { include: { classroom: true } } } },
        verifiedBy: true,
      },
    });
    if (!payment) throw new NotFoundException("Payment not found");

    const header = await this.header("BUKTI PEMBAYARAN", payment.paymentNumber);
    return this.pdf.render(header, (doc) => {
      this.pdf.drawKeyValueBlock(doc, [
        { label: "No. Pembayaran", value: payment.paymentNumber },
        { label: "No. Invoice", value: payment.invoice.invoiceNumber },
        { label: "Tanggal Bayar", value: this.toDateTime(payment.paidAt) },
        { label: "Status", value: this.statusLabel(payment.status, "payment") },
      ]);

      this.pdf.drawSectionTitle(doc, "Data Siswa");
      this.pdf.drawKeyValueBlock(doc, [
        { label: "Nama", value: payment.invoice.student.name },
        { label: "NIS", value: payment.invoice.student.nis },
        { label: "Kelas", value: payment.invoice.student.classroom?.name ?? "-" },
      ]);

      this.pdf.drawSectionTitle(doc, "Detail Pembayaran");
      this.pdf.drawKeyValueBlock(
        doc,
        [
          { label: "Metode", value: this.methodLabel(payment.method) },
          { label: "Jumlah", value: this.toIdr(payment.amount) },
          { label: "Verifikasi", value: payment.verifiedAt ? `Pada ${this.toDateTime(payment.verifiedAt)}` : "Belum diverifikasi" },
          { label: "Diverifikasi Oleh", value: payment.verifiedBy?.name ?? payment.verifiedBy?.email ?? "-" },
        ],
        1,
      );

      this.pdf.drawKeyValueBlock(
        doc,
        [
          { label: "Total Invoice", value: this.toIdr(payment.invoice.total) },
          { label: "Sudah Dibayar", value: this.toIdr(payment.invoice.paidAmount) },
          { label: "Sisa Tagihan", value: this.toIdr(Number(payment.invoice.total) - Number(payment.invoice.paidAmount)) },
        ],
        1,
      );

      if (payment.note) {
        this.pdf.drawSectionTitle(doc, "Catatan");
        this.pdf.drawText(doc, payment.note);
      }

      this.pdf.drawSignatureBlock(
        doc,
        payment.invoice.student.classroom?.name || "Sekolah",
        "Petugas Keuangan",
        payment.verifiedBy?.name ?? null,
      );
    });
  }

  async renderPpdbProofPdf(registrationId: string): Promise<Buffer> {
    const reg = await this.prisma.ppdbRegistration.findFirst({
      where: { id: registrationId },
      include: {
        period: { include: { academicYear: true } },
        selectedDepartment: true,
        selectedCompetency: true,
        verifiedBy: true,
      },
    });
    if (!reg) throw new NotFoundException("PPDB registration not found");

    const header = await this.header("BUKTI PENDAFTARAN PPDB", reg.registrationNumber);
    return this.pdf.render(header, (doc) => {
      this.pdf.drawKeyValueBlock(doc, [
        { label: "No. Pendaftaran", value: reg.registrationNumber },
        { label: "Periode", value: reg.period?.name ?? "-" },
        { label: "Tahun Ajaran", value: reg.period?.academicYear?.name ?? "-" },
        { label: "Tanggal Daftar", value: this.toDateTime(reg.createdAt) },
        { label: "Status", value: this.statusLabel(reg.status, "ppdb") },
      ]);

      this.pdf.drawSectionTitle(doc, "Data Pendaftar");
      this.pdf.drawKeyValueBlock(doc, [
        { label: "Nama Lengkap", value: reg.name },
        { label: "Jenis Kelamin", value: this.genderLabel(reg.gender) },
        { label: "Tempat Lahir", value: reg.birthPlace ?? "-" },
        { label: "Tanggal Lahir", value: this.toDate(reg.birthDate) },
        { label: "No. Telepon", value: reg.phone },
        { label: "Email", value: reg.email ?? "-" },
      ]);

      this.pdf.drawSectionTitle(doc, "Asal Sekolah");
      this.pdf.drawKeyValueBlock(
        doc,
        [
          { label: "Sekolah Asal", value: reg.previousSchool ?? "-" },
          { label: "Alamat", value: reg.address ?? "-" },
        ],
        1,
      );

      this.pdf.drawSectionTitle(doc, "Pilihan Jurusan / Program");
      this.pdf.drawKeyValueBlock(
        doc,
        [
          { label: "Jurusan", value: reg.selectedDepartment?.name ?? "-" },
          { label: "Program Keahlian", value: reg.selectedCompetency?.name ?? "-" },
        ],
        1,
      );

      if (reg.note) {
        this.pdf.drawSectionTitle(doc, "Catatan");
        this.pdf.drawText(doc, reg.note);
      }

      this.pdf.drawSignatureBlock(doc, "Sekolah", "Panitia PPDB", reg.verifiedBy?.name ?? null);
    });
  }

  async renderAttendanceRecapPdf(classroomId: string, startDate: Date, endDate: Date): Promise<Buffer> {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, deletedAt: null },
      include: { competency: true, students: { where: { deletedAt: null, status: "ACTIVE" as any }, orderBy: { name: "asc" } } },
    });
    if (!classroom) throw new NotFoundException("Classroom not found");

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: classroom.students.map((s) => s.id) },
        session: { date: { gte: start, lte: end } },
      },
      include: { session: { select: { date: true } } },
    });

    const summaryByStudent: Record<string, { PRESENT: number; ABSENT: number; LATE: number; PERMIT: number; SICK: number }> = {};
    for (const student of classroom.students) {
      summaryByStudent[student.id] = { PRESENT: 0, ABSENT: 0, LATE: 0, PERMIT: 0, SICK: 0 };
    }
    for (const r of records) {
      const target = summaryByStudent[r.studentId];
      if (target && r.status in target) {
        target[r.status as keyof typeof target] += 1;
      }
    }

    const header = await this.header("REKAP ABSENSI KELAS", `${classroom.code} • ${classroom.name}`);
    return this.pdf.render(header, (doc) => {
      this.pdf.drawKeyValueBlock(doc, [
        { label: "Kelas", value: `${classroom.name} (${classroom.code})` },
        { label: "Jurusan", value: classroom.competency?.name ?? "-" },
        { label: "Tingkat", value: String(classroom.level) },
      ]);

      this.pdf.drawKeyValueBlock(
        doc,
        [
          { label: "Periode Awal", value: this.toDate(start) },
          { label: "Periode Akhir", value: this.toDate(end) },
          { label: "Jumlah Siswa", value: String(classroom.students.length) },
          { label: "Total Catatan", value: String(records.length) },
        ],
        2,
      );

      this.pdf.drawSectionTitle(doc, "Rekap Per Siswa");
      this.pdf.drawTable(
        doc,
        [
          { header: "#", width: 28, align: "center" },
          { header: "NIS", width: 70, align: "left" },
          { header: "Nama Siswa", width: 180, align: "left" },
          { header: "H", width: 32, align: "right" },
          { header: "S", width: 32, align: "right" },
          { header: "I", width: 32, align: "right" },
          { header: "A", width: 32, align: "right" },
          { header: "T", width: 32, align: "right" },
          { header: "% Hadir", width: 50, align: "right" },
        ],
        classroom.students.length === 0
          ? [{ cells: [{ text: "Tidak ada siswa aktif", align: "center" }] }]
          : classroom.students.map((student, idx) => {
              const summary = summaryByStudent[student.id];
              const total = summary.PRESENT + summary.SICK + summary.PERMIT + summary.ABSENT + summary.LATE;
              const present = summary.PRESENT;
              const percent = total === 0 ? 0 : Math.round((present / total) * 1000) / 10;
              return {
                cells: [
                  { text: idx + 1, align: "center" },
                  { text: student.nis, align: "left" },
                  { text: student.name, align: "left" },
                  { text: summary.PRESENT, align: "right" },
                  { text: summary.SICK, align: "right" },
                  { text: summary.PERMIT, align: "right" },
                  { text: summary.ABSENT, align: "right" },
                  { text: summary.LATE, align: "right" },
                  { text: `${percent.toFixed(1)}%`, align: "right" },
                ],
              };
            }),
        { minRowHeight: 18 },
      );

      this.pdf.drawText(doc, "Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alfa, T = Terlambat", { size: 8 });
      this.pdf.drawSignatureBlock(doc, classroom.name, "Wali Kelas");
    });
  }

  async renderGradeRecapPdf(classroomId: string, semesterId?: string): Promise<Buffer> {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, deletedAt: null },
      include: { competency: true, students: { where: { deletedAt: null, status: "ACTIVE" as any }, orderBy: { name: "asc" } } },
    });
    if (!classroom) throw new NotFoundException("Classroom not found");

    const semester = semesterId
      ? await this.prisma.semester.findFirst({
          where: { id: semesterId },
          include: { academicYear: true },
        })
      : await this.prisma.semester.findFirst({
          where: { isActive: true },
          include: { academicYear: true },
          orderBy: { startDate: "desc" },
        });

    const teachingAssignments = await this.prisma.teachingAssignment.findMany({
      where: { classroomId },
      include: { subject: true, teacher: true },
      orderBy: { subject: { name: "asc" } },
    });

    const assessmentWhere: Record<string, unknown> = {
      teachingAssignmentId: { in: teachingAssignments.map((ta) => ta.id) },
      deletedAt: null,
    };

    const assessments = await this.prisma.assessment.findMany({
      where: assessmentWhere,
      include: { grades: { include: { student: true } } },
      orderBy: { dueDate: "asc" },
    });

    const subjectScores: Record<string, { name: string; maxScore: number; total: number; count: number }> = {};
    for (const a of assessments) {
      const subject = a.teachingAssignmentId;
      if (!subjectScores[subject]) {
        const ta = teachingAssignments.find((t) => t.id === subject);
        subjectScores[subject] = { name: ta?.subject?.name ?? "-", maxScore: 0, total: 0, count: 0 };
      }
      for (const g of a.grades) {
        if (g.status === GradeStatus.APPROVED) {
          subjectScores[subject].total += g.score;
          subjectScores[subject].count += 1;
        }
      }
    }

    const perStudentAvg: Record<string, { total: number; count: number }> = {};
    for (const a of assessments) {
      for (const g of a.grades) {
        if (g.status !== GradeStatus.APPROVED) continue;
        if (!perStudentAvg[g.studentId]) perStudentAvg[g.studentId] = { total: 0, count: 0 };
        perStudentAvg[g.studentId].total += g.score;
        perStudentAvg[g.studentId].count += 1;
      }
    }

    const subjectNames = Array.from(new Set(teachingAssignments.map((ta) => ta.subject?.name).filter(Boolean))) as string[];

    const header = await this.header("REKAP NILAI KELAS", `${classroom.code} • ${semester?.name ?? "Tanpa Semester"}`);
    return this.pdf.render(header, (doc) => {
      this.pdf.drawKeyValueBlock(doc, [
        { label: "Kelas", value: `${classroom.name} (${classroom.code})` },
        { label: "Jurusan", value: classroom.competency?.name ?? "-" },
        { label: "Tingkat", value: String(classroom.level) },
      ]);

      this.pdf.drawKeyValueBlock(
        doc,
        [
          { label: "Semester", value: semester?.name ?? "-" },
          { label: "Tahun Ajaran", value: semester?.academicYear?.name ?? "-" },
          { label: "Jumlah Siswa", value: String(classroom.students.length) },
          { label: "Jumlah Penilaian", value: String(assessments.length) },
        ],
        2,
      );

      this.pdf.drawSectionTitle(doc, "Ringkasan Mata Pelajaran");
      this.pdf.drawTable(
        doc,
        [
          { header: "#", width: 28, align: "center" },
          { header: "Mata Pelajaran", width: 200, align: "left" },
          { header: "Pengajar", width: 160, align: "left" },
          { header: "Jumlah Nilai", width: 60, align: "right" },
          { header: "Rata-rata", width: 60, align: "right" },
        ],
        teachingAssignments.length === 0
          ? [{ cells: [{ text: "Tidak ada mata pelajaran", align: "center" }] }]
          : teachingAssignments.map((ta, idx) => {
              const stats = subjectScores[ta.id] ?? { total: 0, count: 0 };
              const avg = stats.count === 0 ? "-" : (stats.total / stats.count).toFixed(2);
              return {
                cells: [
                  { text: idx + 1, align: "center" },
                  { text: ta.subject?.name ?? "-", align: "left" },
                  { text: ta.teacher?.name ?? "-", align: "left" },
                  { text: String(stats.count), align: "right" },
                  { text: avg, align: "right" },
                ],
              };
            }),
        { minRowHeight: 18 },
      );

      this.pdf.drawSectionTitle(doc, "Rekap Per Siswa");
      this.pdf.drawTable(
        doc,
        [
          { header: "#", width: 28, align: "center" },
          { header: "NIS", width: 70, align: "left" },
          { header: "Nama Siswa", width: 220, align: "left" },
          { header: "Jumlah Nilai", width: 70, align: "right" },
          { header: "Rata-rata", width: 80, align: "right" },
        ],
        classroom.students.length === 0
          ? [{ cells: [{ text: "Tidak ada siswa aktif", align: "center" }] }]
          : classroom.students.map((student, idx) => {
              const stats = perStudentAvg[student.id] ?? { total: 0, count: 0 };
              const avg = stats.count === 0 ? "-" : (stats.total / stats.count).toFixed(2);
              return {
                cells: [
                  { text: idx + 1, align: "center" },
                  { text: student.nis, align: "left" },
                  { text: student.name, align: "left" },
                  { text: String(stats.count), align: "right" },
                  { text: avg, align: "right" },
                ],
              };
            }),
        { minRowHeight: 18 },
      );

      this.pdf.drawText(
        doc,
        `Rata-rata dihitung dari nilai berstatus APPROVED.${subjectNames.length ? " Mata pelajaran: " + subjectNames.join(", ") : ""}`,
        { size: 8 },
      );

      this.pdf.drawSignatureBlock(doc, classroom.name, "Wali Kelas");
    });
  }
}
