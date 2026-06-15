import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { AuthenticatedUser, RequestWithUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { PdfService } from "../pdf/pdf.service";

@Injectable()
export class ExamPdfService {
  constructor(
    @Inject(PdfService) private readonly pdf: PdfService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async generateExamCard(examId: string, user: AuthenticatedUser, request: RequestWithUser): Promise<Buffer> {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, deletedAt: null },
      include: {
        examType: true,
        academicYear: true,
        schedules: { where: { deletedAt: null }, include: { room: true }, orderBy: { date: "asc" } },
      },
    });
    if (!exam) throw new NotFoundException("Exam not found");

    const header = { ...(await this.pdf.getSchoolHeader()), title: "KARTU UJIAN" };

    return this.pdf.render(header, (doc) => {
      this.pdf.drawSectionTitle(doc, exam.name);

      const items = [
        { label: "Kode", value: exam.code },
        { label: "Tipe", value: exam.examType.name },
        { label: "Tahun Akademik", value: exam.academicYear.name },
        { label: "Durasi", value: `${exam.duration} menit` },
        { label: "Status", value: exam.status },
      ];
      this.pdf.drawKeyValueBlock(doc, items, 2);

      if (exam.schedules.length > 0) {
        this.pdf.drawSectionTitle(doc, "Jadwal");
        for (const s of exam.schedules) {
          const room = s.room ? `${s.room.name}` : "-";
          this.pdf.drawText(doc, `${s.date.toLocaleDateString("id-ID")} ${s.startTime}-${s.endTime} (${room})`);
        }
      }

      this.pdf.drawSignatureBlock(doc, "Tangerang", "Kepala Sekolah", "");
    });
  }

  async generateParticipantCard(examId: string, participantId: string, user: AuthenticatedUser, request: RequestWithUser): Promise<Buffer> {
    const participant = await this.prisma.examParticipant.findFirst({
      where: { id: participantId, examId, deletedAt: null },
      include: {
        exam: {
          include: {
            examType: true,
            academicYear: true,
            schedules: { where: { deletedAt: null }, include: { room: true }, orderBy: { date: "asc" } },
          },
        },
        student: { include: { user: { select: { id: true, name: true } } } },
        session: true,
      },
    });
    if (!participant) throw new NotFoundException("Participant not found");

    const header = { ...(await this.pdf.getSchoolHeader()), title: "KARTU PESERTA UJIAN" };

    return this.pdf.render(header, (doc) => {
      this.pdf.drawSectionTitle(doc, `${participant.student.user?.name ?? "-"}`);

      const items = [
        { label: "Nomor Peserta", value: `${participant.number ?? "-"}` },
        { label: "Ujian", value: participant.exam.name },
        { label: "Tipe", value: participant.exam.examType.name },
        { label: "Tahun Akademik", value: participant.exam.academicYear.name },
        { label: "Status", value: participant.status },
      ];
      this.pdf.drawKeyValueBlock(doc, items, 2);

      const schedule = participant.exam.schedules[0];
      if (schedule) {
        this.pdf.drawSectionTitle(doc, "Jadwal");
        this.pdf.drawText(doc, `${schedule.date.toLocaleDateString("id-ID")} ${schedule.startTime}-${schedule.endTime}`);
      }

      this.pdf.drawSignatureBlock(doc, "Tangerang", "Kepala Sekolah", "");
    });
  }
}
