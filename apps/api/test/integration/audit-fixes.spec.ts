import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { adminToken, db, mintAccessToken, post } from "./helpers";

/**
 * Regression coverage for the audit remediation:
 *  - object-level authorization on grade input (teacher scoping + enrollment + approval lock)
 *  - finance integrity guards (cannot cancel an invoice with verified payments;
 *    cannot verify a payment for a cancelled invoice).
 *
 * The grade tests provision a DEDICATED teacher/user/assignment/assessment so they never
 * mutate the shared seeded `guru` account that auth.spec relies on.
 */
describe("audit fixes (integration)", () => {
  let admin: string;
  let teacherToken: string;
  let ownAssessmentId: string;
  let otherAssessmentId: string;
  let ownAssignmentId: string;
  let otherAssignmentId: string;
  let enrolledStudentId: string;

  beforeAll(async () => {
    admin = await adminToken();

    const guruRole = await db.role.findFirstOrThrow({ where: { slug: "guru" } });
    const ta1 = await db.teachingAssignment.findUniqueOrThrow({ where: { id: "seed-ta-1" } });
    const student = await db.student.findFirstOrThrow({ where: { classroomId: ta1.classroomId, deletedAt: null } });
    enrolledStudentId = student.id;

    // Our authenticated teacher and an assessment they own.
    const ownEmail = `authz-teacher-${Date.now()}@test.local`;
    const ownUser = await db.user.create({
      data: {
        email: ownEmail,
        name: "Authz Teacher",
        passwordHash: "placeholder-hash",
        status: "ACTIVE",
        forceChangePassword: false,
        roles: { create: { roleId: guruRole.id } },
      },
    });
    const ownTeacher = await db.teacher.create({ data: { name: "Authz Teacher", gender: "MALE", userId: ownUser.id } });
    const ownAssignment = await db.teachingAssignment.create({
      data: {
        teacherId: ownTeacher.id,
        subjectId: ta1.subjectId,
        classroomId: ta1.classroomId,
        academicYearId: ta1.academicYearId,
        semesterId: ta1.semesterId,
        isActive: true,
      },
    });
    ownAssignmentId = ownAssignment.id;
    ownAssessmentId = (
      await db.assessment.create({ data: { teachingAssignmentId: ownAssignment.id, name: "Authz Own Assessment", maxScore: 100 } })
    ).id;
    teacherToken = await mintAccessToken(ownEmail);

    // A different teacher's assessment (real CUID so it passes the id pipe) for the negative case.
    const otherTeacher = await db.teacher.create({ data: { name: "Other Teacher", gender: "FEMALE" } });
    const otherAssignment = await db.teachingAssignment.create({
      data: {
        teacherId: otherTeacher.id,
        subjectId: ta1.subjectId,
        classroomId: ta1.classroomId,
        academicYearId: ta1.academicYearId,
        semesterId: ta1.semesterId,
        isActive: true,
      },
    });
    otherAssignmentId = otherAssignment.id;
    otherAssessmentId = (
      await db.assessment.create({ data: { teachingAssignmentId: otherAssignment.id, name: "Other Assessment", maxScore: 100 } })
    ).id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe("grades object-level authorization", () => {
    it("lets the assigned teacher input scores for their own assessment", async () => {
      const res = await post(
        `grades/assessments/${ownAssessmentId}/scores`,
        { scores: [{ studentId: enrolledStudentId, score: 88 }] },
        teacherToken,
      );
      expect(res.status).toBe(201);
    });

    it("rejects a student who is not enrolled in the assessment's classroom", async () => {
      const res = await post(
        `grades/assessments/${ownAssessmentId}/scores`,
        { scores: [{ studentId: "clznotenrolled0000000000", score: 90 }] },
        teacherToken,
      );
      expect(res.status).toBe(400);
    });

    it("forbids a teacher from creating an assessment on another teacher's assignment", async () => {
      const res = await post(
        "grades/assessments",
        { teachingAssignmentId: otherAssignmentId, name: "Cross-class assessment", type: "QUIZ", maxScore: 100 },
        teacherToken,
      );
      expect(res.status).toBe(403);
    });

    it("forbids a teacher from grading another teacher's assessment", async () => {
      const res = await post(
        `grades/assessments/${otherAssessmentId}/scores`,
        { scores: [{ studentId: enrolledStudentId, score: 70 }] },
        teacherToken,
      );
      expect(res.status).toBe(403);
    });

    it("blocks re-entering scores once a grade is APPROVED", async () => {
      const approve = await post(`grades/assessments/${ownAssessmentId}/approve`, { status: "APPROVED" }, admin);
      expect(approve.status).toBe(201);

      const res = await post(
        `grades/assessments/${ownAssessmentId}/scores`,
        { scores: [{ studentId: enrolledStudentId, score: 95 }] },
        teacherToken,
      );
      expect(res.status).toBe(400);
    });
  });

  describe("finance integrity guards", () => {
    let studentId: string;

    beforeAll(async () => {
      const student = await db.student.findFirstOrThrow({ where: { deletedAt: null } });
      studentId = student.id;
    });

    async function newInvoice(unitPrice: number) {
      const res = await post(
        "invoices",
        { studentId, discount: 0, penalty: 0, items: [{ name: "Audit fee", quantity: 1, unitPrice }] },
        admin,
      );
      expect(res.status).toBe(201);
      return res.body.data.id as string;
    }

    it("refuses to cancel an invoice that has verified payments", async () => {
      const invoiceId = await newInvoice(50_000);
      const pay = await post("payments", { invoiceId, amount: 50_000, method: "CASH" }, admin);
      expect(pay.status).toBe(201);
      const verify = await post(`payments/${pay.body.data.id}/verify`, {}, admin);
      expect(verify.status).toBe(201);

      const cancel = await post(`invoices/${invoiceId}/cancel`, {}, admin);
      expect(cancel.status).toBe(400);
    });

    it("refuses to verify a payment for a cancelled invoice", async () => {
      const invoiceId = await newInvoice(40_000);
      const pay = await post("payments", { invoiceId, amount: 40_000, method: "CASH" }, admin);
      expect(pay.status).toBe(201);

      // Cancelling is allowed while the payment is still PENDING (no verified payments yet).
      const cancel = await post(`invoices/${invoiceId}/cancel`, {}, admin);
      expect(cancel.status).toBe(201);

      // Verifying the now-orphaned pending payment must be rejected.
      const verify = await post(`payments/${pay.body.data.id}/verify`, {}, admin);
      expect(verify.status).toBe(400);
    });
  });
});
