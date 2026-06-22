/**
 * Demo fixtures for the integration suite.
 *
 * The production seed (prisma/seed.ts) intentionally only creates roles,
 * permissions and the super-admin. The integration specs, however, assert
 * behaviour against realistic domain data (students, a `guru`/`siswa` portal
 * user, a teaching assignment with the well-known id `seed-ta-1`, exam/library
 * master data, three payroll employees, an active PPDB period).
 *
 * This module provisions exactly that data directly against the test database,
 * AFTER `prisma db seed` has run in global-setup. Keeping it here (instead of in
 * the production seed) means the production seed stays minimal and no demo data
 * ever leaks into a real deployment.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { SEED_DEFAULT_PASSWORD, SUPER_ADMIN_EMAIL, TEST_DATABASE_URL } from "./config";

export async function seedIntegrationFixtures() {
  const db = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });
  try {
    const passwordHash = await bcrypt.hash(SEED_DEFAULT_PASSWORD, 12);

    const superAdmin = await db.user.findUniqueOrThrow({ where: { email: SUPER_ADMIN_EMAIL } });
    const guruRole = await db.role.findUniqueOrThrow({ where: { slug: "guru" } });
    const siswaRole = await db.role.findUniqueOrThrow({ where: { slug: "siswa" } });

    // --- Academic backbone ---
    const academicYear = await db.academicYear.create({
      data: {
        id: "seed-ay-1",
        name: "2099/2100",
        startDate: new Date("2099-07-01"),
        endDate: new Date("2100-06-30"),
        isActive: true,
      },
    });

    const semester = await db.semester.create({
      data: {
        id: "seed-sem-1",
        academicYearId: academicYear.id,
        name: "Ganjil 2099/2100",
        order: 1,
        startDate: new Date("2099-07-01"),
        endDate: new Date("2099-12-31"),
        isActive: true,
      },
    });

    const department = await db.department.create({
      data: { id: "seed-dept-1", code: "ITEST-TKJ", name: "Teknik Komputer dan Jaringan" },
    });
    const competency = await db.competency.create({
      data: { id: "seed-comp-1", departmentId: department.id, code: "ITEST-TKJ-1", name: "TKJ" },
    });
    const classroom = await db.classroom.create({
      data: { id: "seed-class-1", competencyId: competency.id, code: "ITEST-X-TKJ-1", name: "X TKJ 1", level: 10 },
    });
    const subject = await db.subject.create({
      data: { id: "seed-subj-1", code: "ITEST-MTK", name: "Matematika" },
    });

    // --- Portal users (guru + siswa) with the default seed password, gated by forceChangePassword ---
    const guruUser = await db.user.create({
      data: {
        email: "guru1@nexsmsid.dev",
        name: "Guru Integrasi",
        passwordHash,
        forceChangePassword: true,
        roles: { create: { roleId: guruRole.id } },
      },
    });

    await db.user.create({
      data: {
        email: "siswa1@nexsmsid.dev",
        name: "Siswa Integrasi",
        passwordHash,
        forceChangePassword: true,
        roles: { create: { roleId: siswaRole.id } },
      },
    });

    const teacher = await db.teacher.create({
      data: { id: "seed-teacher-1", name: "Guru Integrasi", gender: "MALE", userId: guruUser.id },
    });

    await db.teachingAssignment.create({
      data: {
        id: "seed-ta-1",
        teacherId: teacher.id,
        subjectId: subject.id,
        classroomId: classroom.id,
        academicYearId: academicYear.id,
        semesterId: semester.id,
      },
    });

    // --- Students in the seeded classroom (exams need >= 2; finance/audit pick the first) ---
    const students = [];
    for (let i = 1; i <= 3; i++) {
      students.push(
        await db.student.create({
          data: {
            nis: `ITEST-NIS-${i}`,
            name: `Siswa Demo ${i}`,
            gender: i % 2 === 0 ? "FEMALE" : "MALE",
            classroomId: classroom.id,
            status: "ACTIVE",
            enrolledAt: new Date("2099-07-01"),
          },
        }),
      );
    }

    // --- Exam master data ---
    await db.examType.create({ data: { code: "ITEST-UTS", name: "Ujian Tengah Semester" } });
    await db.examRoom.create({ data: { code: "ITEST-ROOM-1", name: "Ruang Ujian 1", capacity: 40 } });

    // --- Library master data + an ACTIVE member (specs look these up by filter) ---
    await db.libraryCategory.create({ data: { code: "ITEST-LIB-CAT", name: "Umum" } });
    await db.libraryMember.create({
      data: {
        memberCode: "ITEST-LM-1",
        type: "STUDENT",
        status: "ACTIVE",
        studentId: students[0].id,
      },
    });

    // --- Payroll: components + 3 ACTIVE employees, each with fixed earnings and % deductions ---
    const gapok = await db.payrollComponent.create({
      data: { code: "ITEST-GAPOK", name: "Gaji Pokok", type: "EARNING", calculationType: "FIXED" },
    });
    const tunjangan = await db.payrollComponent.create({
      data: { code: "ITEST-TUNJANGAN", name: "Tunjangan", type: "EARNING", calculationType: "FIXED" },
    });
    const transport = await db.payrollComponent.create({
      data: { code: "ITEST-TRANSPORT", name: "Transport", type: "EARNING", calculationType: "FIXED" },
    });
    const potongan = await db.payrollComponent.create({
      data: { code: "ITEST-POTONGAN", name: "Potongan", type: "DEDUCTION", calculationType: "PERCENTAGE" },
    });
    const pajak = await db.payrollComponent.create({
      data: { code: "ITEST-PAJAK", name: "Pajak", type: "DEDUCTION", calculationType: "PERCENTAGE" },
    });

    for (let i = 1; i <= 3; i++) {
      const employee = await db.employeeProfile.create({
        data: {
          employeeCode: `ITEST-EMP-${i}`,
          fullName: `Pegawai Demo ${i}`,
          status: "ACTIVE",
          createdById: superAdmin.id,
        },
      });
      await db.employeeSalaryComponent.createMany({
        data: [
          { employeeId: employee.id, componentId: gapok.id, amount: 5_000_000 },
          { employeeId: employee.id, componentId: tunjangan.id, amount: 1_500_000 },
          { employeeId: employee.id, componentId: transport.id, amount: 500_000 },
          { employeeId: employee.id, componentId: potongan.id, percentage: 2 },
          { employeeId: employee.id, componentId: pajak.id, percentage: 5 },
        ],
      });
    }

    // --- Active PPDB period (public endpoints + provisioning) ---
    const ppdbPeriod = await db.ppdbPeriod.create({
      data: {
        name: "PPDB 2099/2100",
        academicYearId: academicYear.id,
        startDate: new Date(Date.now() - 86_400_000),
        endDate: new Date(Date.now() + 30 * 86_400_000),
        isActive: true,
        quota: 50,
      },
    });

    // Registration with a known PIN for the document-upload-security spec.
    await db.ppdbRegistration.create({
      data: {
        registrationNumber: "REG-202606-00001",
        periodId: ppdbPeriod.id,
        name: "Pendaftar Demo",
        gender: "MALE",
        phone: "081111222333",
        accessPinHash: await bcrypt.hash("123456", 12),
      },
    });
  } finally {
    await db.$disconnect();
  }
}
