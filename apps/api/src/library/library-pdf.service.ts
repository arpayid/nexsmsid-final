import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { PdfService } from "../pdf/pdf.service";

@Injectable()
export class LibraryPdfService {
  private readonly logger = new Logger(LibraryPdfService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  async generateBookPdf(id: string): Promise<Buffer> {
    const book = await this.prisma.libraryBook.findUniqueOrThrow({
      where: { id },
      include: { category: true, shelf: true },
    });

    const baseHeader = await this.pdfService.getSchoolHeader();
    return this.pdfService.render({ ...baseHeader, title: "Detail Buku", printedAt: new Date() }, (doc) => {
      this.pdfService.drawKeyValueBlock(doc, [
        { label: "Kode Buku", value: book.code },
        { label: "Judul", value: book.title },
        { label: "Penulis", value: book.author },
        { label: "Penerbit", value: book.publisher || "-" },
        { label: "Kategori", value: book.category?.name || "-" },
        { label: "Rak", value: book.shelf?.name || "-" },
      ]);
    });
  }

  async generateCopyLabel(id: string): Promise<Buffer> {
    const copy = await this.prisma.libraryBookCopy.findUniqueOrThrow({
      where: { id },
      include: { book: true },
    });

    const baseHeader = await this.pdfService.getSchoolHeader();
    return this.pdfService.render({ ...baseHeader, title: "Label Eksemplar Buku", printedAt: new Date() }, (doc) => {
      this.pdfService.drawKeyValueBlock(doc, [
        { label: "Judul Buku", value: copy.book.title },
        { label: "Kode Eksemplar", value: copy.copyCode },
        { label: "Barcode", value: copy.barcode || copy.copyCode },
        { label: "ISBN", value: copy.book.isbn || "-" },
        { label: "Kondisi", value: copy.condition || "-" },
      ]);
    });
  }

  async generateLoanReceipt(id: string): Promise<Buffer> {
    const loan = await this.prisma.libraryLoan.findUniqueOrThrow({
      where: { id },
      include: {
        copy: { include: { book: true } },
        member: { include: { user: true, student: true, teacher: true, staff: true } },
        borrowedBy: true,
      },
    });

    const memberName =
      loan.member.student?.name ||
      loan.member.teacher?.name ||
      loan.member.staff?.name ||
      loan.member.user?.name ||
      loan.member.externalName ||
      "-";

    const baseHeader = await this.pdfService.getSchoolHeader();
    return this.pdfService.render({ ...baseHeader, title: "Struk Peminjaman Buku", printedAt: loan.borrowedAt }, (doc) => {
      this.pdfService.drawKeyValueBlock(
        doc,
        [
          { label: "Peminjam", value: `${memberName} (${loan.member.memberCode})` },
          { label: "Judul Buku", value: loan.copy.book.title },
          { label: "Kode Copy", value: loan.copy.copyCode },
          { label: "Tanggal Pinjam", value: loan.borrowedAt.toISOString().split("T")[0] },
          { label: "Tenggat Waktu", value: loan.dueAt.toISOString().split("T")[0] },
          { label: "Status", value: loan.status },
        ],
        1,
      );
      this.pdfService.drawSignatureBlock(doc, "Jakarta", "Petugas Perpustakaan", loan.borrowedBy.name);
    });
  }

  async generateMemberCard(id: string): Promise<Buffer> {
    const member = await this.prisma.libraryMember.findUniqueOrThrow({
      where: { id },
      include: { user: true, student: true, teacher: true, staff: true },
    });

    const memberName =
      member.student?.name || member.teacher?.name || member.staff?.name || member.user?.name || member.externalName || "-";

    const baseHeader = await this.pdfService.getSchoolHeader();
    return this.pdfService.render({ ...baseHeader, title: "Kartu Anggota Perpustakaan", printedAt: member.joinedAt }, (doc) => {
      this.pdfService.drawKeyValueBlock(
        doc,
        [
          { label: "Nama", value: memberName },
          { label: "Nomor Anggota", value: member.memberCode },
          { label: "Tipe Anggota", value: member.type },
          { label: "Berlaku s/d", value: member.expiredAt ? member.expiredAt.toISOString().split("T")[0] : "Seumur Hidup" },
        ],
        1,
      );
    });
  }

  async generateLibrarySummary(): Promise<Buffer> {
    const totalBooks = await this.prisma.libraryBook.count({ where: { deletedAt: null } });
    const totalCopies = await this.prisma.libraryBookCopy.count({ where: { deletedAt: null } });
    const totalMembers = await this.prisma.libraryMember.count({ where: { deletedAt: null } });
    const activeLoans = await this.prisma.libraryLoan.count({ where: { status: "BORROWED", deletedAt: null } });

    const baseHeader = await this.pdfService.getSchoolHeader();
    return this.pdfService.render({ ...baseHeader, title: "Ringkasan Perpustakaan", printedAt: new Date() }, (doc) => {
      this.pdfService.drawKeyValueBlock(
        doc,
        [
          { label: "Total Judul Buku", value: totalBooks.toString() },
          { label: "Total Eksemplar", value: totalCopies.toString() },
          { label: "Total Anggota Aktif", value: totalMembers.toString() },
          { label: "Peminjaman Aktif", value: activeLoans.toString() },
        ],
        2,
      );
    });
  }
}
