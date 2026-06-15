import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { adminToken, db, get, post } from "./helpers";

describe("exams (integration)", () => {
  let token: string;
  let examId: string;
  let examTypeId: string;
  let academicYearId: string;
  let semesterId: string;
  let roomId: string;
  let studentIds: string[];

  beforeAll(async () => {
    token = await adminToken();

    const examType = await db.examType.findFirstOrThrow({ where: { deletedAt: null } });
    const semester = await db.semester.findFirstOrThrow({ where: { isActive: true } });
    const room = await db.examRoom.findFirstOrThrow({ where: { deletedAt: null } });
    const students = await db.student.findMany({ where: { deletedAt: null }, take: 3 });

    examTypeId = examType.id;
    academicYearId = semester.academicYearId;
    semesterId = semester.id;
    roomId = room.id;
    studentIds = students.map((s) => s.id);
    expect(studentIds.length).toBeGreaterThanOrEqual(2);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("creates an exam in DRAFT", async () => {
    const res = await post(
      "exams",
      {
        examTypeId,
        academicYearId,
        semesterId,
        code: "ITEST-EXM-1",
        name: "Integration Test Exam",
        duration: 90,
        status: "DRAFT",
        passingScore: 70,
        maxScore: 100,
      },
      token,
    );
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("DRAFT");
    examId = res.body.data.id;
  });

  it("enforces the status state machine", async () => {
    // Illegal jump DRAFT -> COMPLETED
    const illegal = await post(`exams/${examId}/status`, { status: "COMPLETED" }, token);
    expect(illegal.status).toBe(400);

    for (const status of ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "GRADED"]) {
      const res = await post(`exams/${examId}/status`, { status }, token);
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(status);
    }

    // GRADED is terminal
    const afterTerminal = await post(`exams/${examId}/status`, { status: "CANCELLED" }, token);
    expect(afterTerminal.status).toBe(400);
  });

  it("bulk-adds participants and dedupes on retry", async () => {
    const count = studentIds.length;

    const first = await post(`exams/${examId}/participants/bulk`, { studentIds }, token);
    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({ added: count, skipped: 0 });

    const second = await post(`exams/${examId}/participants/bulk`, { studentIds }, token);
    expect(second.status).toBe(201);
    expect(second.body.data).toMatchObject({ added: 0, skipped: count });

    const list = await get(`exams/${examId}/participants`, token);
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(count);

    // Participant numbers are sequential and unique
    const numbers = (list.body.data as Array<{ number: number }>).map((p) => p.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: count }, (_, i) => i + 1));
  });

  it("creates a schedule with a session and serves results", async () => {
    const schedule = await post(
      `exams/${examId}/schedules`,
      { roomId, date: "2099-02-01T01:00:00.000Z", startTime: "08:00", endTime: "10:00" },
      token,
    );
    expect(schedule.status).toBe(201);
    const scheduleId = schedule.body.data.id as string;

    const session = await post(`exams/schedules/${scheduleId}/sessions`, { code: "ITEST-SES-1", name: "Sesi 1" }, token);
    expect(session.status).toBe(201);

    const sessions = await get(`exams/schedules/${scheduleId}/sessions`, token);
    expect(sessions.status).toBe(200);
    expect(sessions.body.data.length).toBe(1);

    const results = await get(`exams/${examId}/results`, token);
    expect(results.status).toBe(200);
  });
});
