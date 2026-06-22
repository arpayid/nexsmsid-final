import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ReportDataResult } from "../report-engine.types";
import { ReportProvider, ReportFilters, filterString, filterDate, hasFilter, formatReportDate } from "../report-provider.interface";
import { Prisma } from "@prisma/client";

@Injectable()
export class AcademicReportProvider implements ReportProvider {
  readonly reports: Record<string, (f: ReportFilters) => Promise<ReportDataResult>>;

  constructor(private prisma: PrismaService) {
    this.reports = {
      "students-by-class": this.getStudentsByClass.bind(this),
      "attendance-class-recap": this.getAttendanceClassRecap.bind(this),
      "grades-class-recap": this.getGradesClassRecap.bind(this),
      "teacher-schedule-recap": this.getTeacherScheduleRecap.bind(this),
      "exam-recap": this.getExamRecap.bind(this),
      "exam-participant-list": this.getExamParticipantList.bind(this),
      "exam-results": this.getExamResultsRecap.bind(this),
    };
  }

  supportedReports(): string[] {
    return Object.keys(this.reports);
  }
  async getData(reportCode: string, filters: ReportFilters): Promise<ReportDataResult> {
    const fn = this.reports[reportCode];
    if (!fn) throw new Error(`Report ${reportCode} not handled by AcademicReportProvider`);
    return fn(filters);
  }

  private async getStudentsByClass(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.StudentWhereInput = { deletedAt: null };
    const classroomId = filterString(filters, "classroomId");
    if (classroomId) where.classroomId = classroomId;
    if (hasFilter(filters, "status")) where.status = filters.status as never;
    const students = await this.prisma.student.findMany({
      take: Number(filters.limit || 5000),
      where,
      include: { classroom: true },
      orderBy: [{ classroom: { name: "asc" } }, { name: "asc" }],
    });
    return {
      title: "Students by Class Report",
      columns: [
        { key: "nis", label: "NIS", width: 15 },
        { key: "name", label: "Student Name", width: 30 },
        { key: "gender", label: "Gender", width: 10 },
        { key: "classroom", label: "Class", width: 20 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: students.map((s) => ({ nis: s.nis, name: s.name, gender: s.gender, classroom: s.classroom?.name || "-", status: s.status })),
    };
  }

  private async getAttendanceClassRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.AttendanceSessionWhereInput = {
      date: { gte: filterDate(filters, "startDate"), lte: filterDate(filters, "endDate") },
    };
    if (filterString(filters, "classroomId"))
      where.schedule = { teachingAssignment: { classroomId: filterString(filters, "classroomId") } };
    const sessions = await this.prisma.attendanceSession.findMany({
      take: Number(filters.limit || 5000),
      where,
      include: {
        records: { include: { student: true } },
        schedule: { include: { teachingAssignment: { include: { classroom: true, subject: true } } } },
      },
      orderBy: { date: "asc" },
    });
    const rows: any[] = [];
    for (const session of sessions)
      for (const record of session.records)
        rows.push({
          date: session.date.toISOString().split("T")[0],
          student: record.student.name,
          class: session.schedule.teachingAssignment.classroom.name,
          subject: session.schedule.teachingAssignment.subject.name,
          status: record.status,
          note: record.note || "-",
        });
    return {
      title: "Attendance Class Recap",
      subtitle: `Period: ${String(filters.startDate)} to ${String(filters.endDate)}`,
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "student", label: "Student", width: 30 },
        { key: "class", label: "Class", width: 15 },
        { key: "subject", label: "Subject", width: 20 },
        { key: "status", label: "Status", width: 10 },
        { key: "note", label: "Note", width: 20 },
      ],
      rows,
    };
  }

  private async getGradesClassRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: any = {
      assessment: {
        teachingAssignment: {
          academicYearId: filterString(filters, "academicYearId"),
          semesterId: filterString(filters, "semesterId"),
          classroomId: filterString(filters, "classroomId"),
        },
      },
    };
    const subjectId = filterString(filters, "subjectId");
    if (subjectId) where.assessment.teachingAssignment.subjectId = subjectId;
    const grades = await this.prisma.grade.findMany({
      take: Number(filters.limit || 5000),
      where,
      include: { student: true, assessment: { include: { teachingAssignment: { include: { subject: true, classroom: true } } } } },
      orderBy: [{ student: { name: "asc" } }, { assessment: { createdAt: "asc" } }],
    });
    return {
      title: "Grades Class Recap",
      columns: [
        { key: "student", label: "Student", width: 30 },
        { key: "subject", label: "Subject", width: 20 },
        { key: "assessment", label: "Assessment", width: 25 },
        { key: "score", label: "Score", width: 10 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: grades.map((g) => ({
        student: g.student.name,
        subject: g.assessment.teachingAssignment.subject.name,
        assessment: g.assessment.name,
        score: g.score,
        status: g.status,
      })),
    };
  }

  private async getTeacherScheduleRecap(filters: ReportFilters): Promise<ReportDataResult> {
    const where: any = {
      teachingAssignment: { academicYearId: filterString(filters, "academicYearId"), semesterId: filterString(filters, "semesterId") },
    };
    const teacherId = filterString(filters, "teacherId");
    if (teacherId) where.teachingAssignment.teacherId = teacherId;
    const schedules = await this.prisma.schedule.findMany({
      take: Number(filters.limit || 5000),
      where,
      include: { teachingAssignment: { include: { teacher: true, subject: true, classroom: true } }, lessonHour: true, room: true },
      orderBy: [{ dayOfWeek: "asc" }, { lessonHour: { startTime: "asc" } }],
    });
    return {
      title: "Teacher Schedule Recap",
      columns: [
        { key: "day", label: "Day", width: 15 },
        { key: "time", label: "Time", width: 15 },
        { key: "teacher", label: "Teacher", width: 30 },
        { key: "subject", label: "Subject", width: 20 },
        { key: "classroom", label: "Class", width: 15 },
        { key: "room", label: "Room", width: 15 },
      ],
      rows: schedules.map((s: any) => ({
        day: s.dayOfWeek,
        time: `${s.lessonHour.startTime} - ${s.lessonHour.endTime}`,
        teacher: s.teachingAssignment.teacher.name,
        subject: s.teachingAssignment.subject.name,
        classroom: s.teachingAssignment.classroom.name,
        room: s.room?.name || "-",
      })),
    };
  }

  private async getExamRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: any = { deletedAt: null };
    const semesterId = filterString(f, "semesterId");
    if (semesterId) where.semesterId = semesterId;
    const exams = await this.prisma.exam.findMany({
      take: Number(f.limit || 5000),
      where,
      include: {
        examType: true,
        semester: { include: { academicYear: true } },
        _count: { select: { participants: true, sessions: true } },
      } as any,
      orderBy: { startDate: "desc" } as any,
    });
    return {
      title: "Exam Recap",
      columns: [
        { key: "exam", label: "Exam", width: 25 },
        { key: "type", label: "Type", width: 15 },
        { key: "period", label: "Period", width: 20 },
        { key: "participants", label: "Participants", width: 15 },
        { key: "sessions", label: "Sessions", width: 10 },
      ],
      rows: exams.map((e: any) => ({
        exam: e.title,
        type: e.examType.name,
        period: `${e.semester.academicYear.name} ${e.semester.name}`,
        participants: e._count.participants,
        sessions: e._count.sessions,
      })),
    };
  }

  private async getExamParticipantList(f: ReportFilters): Promise<ReportDataResult> {
    const examId = filterString(f, "examId");
    if (!examId) return { title: "Exam Participant List", columns: [], rows: [] };
    const participants = await this.prisma.examParticipant.findMany({ where: { examId }, include: { student: true, room: true } as any });
    return {
      title: "Exam Participant List",
      columns: [
        { key: "nis", label: "NIS", width: 15 },
        { key: "name", label: "Student Name", width: 30 },
        { key: "classroom", label: "Class", width: 15 },
        { key: "room", label: "Room", width: 15 },
      ],
      rows: participants.map((p: any) => ({
        nis: p.student.nis,
        name: p.student.name,
        classroom: p.student.classroomId || "-",
        room: p.room?.name || "-",
      })),
    };
  }

  private async getExamResultsRecap(f: ReportFilters): Promise<ReportDataResult> {
    const examId = filterString(f, "examId");
    if (!examId) return { title: "Exam Results Recap", columns: [], rows: [] };
    const results = await this.prisma.examResult.findMany({
      where: { participant: { examId } },
      include: { participant: { include: { student: true } }, examSession: { include: { questionBank: true } } } as any,
    });
    return {
      title: "Exam Results Recap",
      columns: [
        { key: "student", label: "Student", width: 30 },
        { key: "session", label: "Session", width: 25 },
        { key: "score", label: "Score", width: 10 },
        { key: "maxScore", label: "Max", width: 10 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: results.map((r: any) => ({
        student: r.participant.student.name,
        session: r.examSession.questionBank.name,
        score: r.score,
        maxScore: r.examSession.totalScore,
        status: r.status || "-",
      })),
    };
  }
}
