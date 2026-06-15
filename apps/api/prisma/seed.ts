import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  "dashboard.view",
  "auth.change-password",
  "auth.logout-all",
  "auth.login-history",
  "users.reset-password",
  "users.unlock",
  "users.force-change-password",
  "users.view",
  "users.create",
  "users.update",
  "users.delete",
  "roles.view",
  "roles.create",
  "roles.update",
  "roles.delete",
  "permissions.view",
  "school-profile.view",
  "school-profile.update",
  "master-data.view",
  "master-data.create",
  "master-data.update",
  "master-data.delete",
  "master-data.import",
  "master-data.export",
  "students.view",
  "students.create",
  "students.update",
  "students.delete",
  "students.import",
  "students.export",
  "guardians.view",
  "guardians.create",
  "guardians.update",
  "guardians.delete",
  "guardians.import",
  "guardians.export",
  "teachers.view",
  "teachers.create",
  "teachers.update",
  "teachers.delete",
  "teachers.import",
  "teachers.export",
  "staffs.view",
  "staffs.create",
  "staffs.update",
  "staffs.delete",
  "staffs.import",
  "staffs.export",
  "teaching-assignments.view",
  "teaching-assignments.manage",
  "schedules.view",
  "schedules.manage",
  "attendance.view",
  "attendance.record",
  "attendance.update",
  "attendance.approve",
  "attendance.export",
  "attendance.print",
  "grades.view",
  "grades.input",
  "grades.update",
  "grades.approve",
  "grades.publish",
  "grades.export",
  "grades.print",
  "invoices.view",
  "invoices.create",
  "invoices.update",
  "invoices.delete",
  "invoices.issue",
  "invoices.cancel",
  "invoices.print",
  "payments.view",
  "payments.create",
  "payments.verify",
  "payments.reject",
  "payments.cancel",
  "payments.print",
  "teacher-portal.view",
  "student-portal.view",
  "guardian-portal.view",
  "expenses.view",
  "expenses.create",
  "expenses.update",
  "expenses.delete",
  "expenses.approve",
  "expenses.pay",
  "finance.view",
  "finance.export",
  "ppdb.view",
  "ppdb.create",
  "ppdb.update",
  "ppdb.delete",
  "ppdb.verify",
  "ppdb.approve",
  "ppdb.reject",
  "ppdb.convert",
  "ppdb.export",
  "ppdb.print",
  "industry-partners.view",
  "industry-partners.create",
  "industry-partners.update",
  "industry-partners.delete",
  "internships.view",
  "internships.create",
  "internships.update",
  "internships.delete",
  "internships.start",
  "internships.complete",
  "internships.cancel",
  "internships.score",
  "internship-logs.view",
  "internship-logs.create",
  "internship-logs.update",
  "internship-logs.approve",
  "internship-logs.reject",
  "alumni.view",
  "alumni.create",
  "alumni.update",
  "alumni.delete",
  "alumni.convert",
  "job-vacancies.view",
  "job-vacancies.create",
  "job-vacancies.update",
  "job-vacancies.delete",
  "job-vacancies.publish",
  "job-vacancies.close",
  "job-applications.view",
  "job-applications.update",
  "job-applications.review",
  "job-applications.accept",
  "job-applications.reject",
  "tracer-studies.view",
  "tracer-studies.create",
  "tracer-studies.update",
  "tracer-studies.delete",
  "bkk.view",
  "bkk.export",
  "announcements.view",
  "announcements.create",
  "announcements.update",
  "announcements.delete",
  "announcements.publish",
  "announcements.archive",
  "messages.view",
  "messages.send",
  "messages.read",
  "messages.delete",
  "notifications.view",
  "notifications.create",
  "notifications.read",
  "notifications.archive",
  "notification-templates.view",
  "notification-templates.create",
  "notification-templates.update",
  "notification-templates.delete",
  "reports.view",
  "reports.generate",
  "reports.download",
  "reports.export",
  "reports.cancel",
  "reports.academic",
  "reports.finance",
  "reports.ppdb",
  "reports.pkl_bkk",
  "reports.communication",
  "report-jobs.view",
  "report-jobs.create",
  "report-jobs.cancel",
  "export-history.view",
  "export-history.export",
  "counseling.view",
  "counseling.create",
  "counseling.update",
  "counseling.delete",
  "discipline.view",
  "discipline.create",
  "discipline.update",
  "discipline.delete",
  "discipline.report",
  "discipline.notify-guardian",
  "discipline.print",
  "letters.view",
  "letters.create",
  "letters.update",
  "letters.delete",
  "letters.approve",
  "letters.reject",
  "letters.issue",
  "letters.archive",
  "letters.print",
  "letters.report",
  "letters.manage-templates",
  "letters.export",
  "inventory.view",
  "inventory.create",
  "inventory.update",
  "inventory.delete",
  "inventory.borrow",
  "inventory.return",
  "inventory.maintenance",
  "inventory.export",
  "inventory.print",
  "library.view",
  "library.create",
  "library.update",
  "library.delete",
  "library.borrow",
  "library.return",
  "library.fine",
  "library.export",
  "library.print",
  "payroll.view",
  "payroll.create",
  "payroll.update",
  "payroll.approve",
  "payroll.pay",
  "payroll.print",
  "payroll.export",
  "exams.view",
  "exams.create",
  "exams.update",
  "exams.delete",
  "exams.schedule",
  "exams.participants",
  "exams.print-card",
  "exams.export",
  "learning.view",
  "learning.create",
  "learning.update",
  "learning.delete",
  "learning.assignments",
  "learning.submissions",
  "learning.grade",
  "approvals.view",
  "approvals.approve",
  "approvals.reject",
  "approvals.delegate",
  "approvals.history",
  "calendar.view",
  "calendar.create",
  "calendar.update",
  "calendar.delete",
  "calendar.publish",
];

const roles = [
  { name: "Super Admin", slug: "super-admin", description: "Full access untuk development dan operasional platform." },
  { name: "Admin Sekolah", slug: "admin-sekolah", description: "Admin operasional sekolah." },
  { name: "Kepala Sekolah", slug: "kepala-sekolah", description: "Akses monitoring manajemen sekolah." },
  { name: "Waka Kurikulum", slug: "waka-kurikulum", description: "Akses kurikulum dan master data akademik." },
  { name: "Waka Kesiswaan", slug: "waka-kesiswaan", description: "Akses kesiswaan dan data pendukung." },
  { name: "Guru", slug: "guru", description: "Akses guru." },
  { name: "Wali Kelas", slug: "wali-kelas", description: "Akses wali kelas." },
  { name: "Siswa", slug: "siswa", description: "Akses siswa." },
  { name: "Orang Tua/Wali", slug: "orang-tua-wali", description: "Akses orang tua atau wali." },
  { name: "Bendahara", slug: "bendahara", description: "Akses keuangan sekolah." },
  { name: "Staff TU", slug: "staff-tu", description: "Akses administrasi tata usaha." },
  { name: "Panitia PPDB", slug: "panitia-ppdb", description: "Akses operasional PPDB." },
  { name: "Pembimbing PKL", slug: "pembimbing-pkl", description: "Akses pembimbing PKL." },
  { name: "Admin BKK", slug: "admin-bkk", description: "Akses bursa kerja khusus." },
  { name: "Konselor BK", slug: "konselor-bk", description: "Untuk modul BK, konseling, pelanggaran, prestasi, tindak lanjut." },
  { name: "Petugas Tata Tertib", slug: "petugas-tata-tertib", description: "Untuk pelanggaran, poin, sanksi, dan disiplin." },
  { name: "Petugas Surat", slug: "petugas-surat", description: "Untuk Letter Management / surat menyurat." },
  { name: "Petugas Sarpras", slug: "petugas-sarpras", description: "Untuk Inventory / Asset Management." },
  { name: "Petugas Perpustakaan", slug: "petugas-perpustakaan", description: "Untuk Library." },
  { name: "HR Payroll", slug: "hr-payroll", description: "Untuk Payroll/slip gaji." },
  { name: "Petugas Ujian", slug: "petugas-ujian", description: "Untuk Exam Management." },
  { name: "Approver", slug: "approver", description: "Untuk Approval Center umum." },
];

const rolePermissionMap: Record<string, string[]> = {
  "super-admin": permissions,
  "admin-sekolah": permissions.filter((permission) => !permission.endsWith(".delete")),
  "kepala-sekolah": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "users.view",
    "roles.view",
    "permissions.view",
    "school-profile.view",
    "master-data.view",
    "students.view",
    "guardians.view",
    "teachers.view",
    "staffs.view",
    "teaching-assignments.view",
    "schedules.view",
    "attendance.view",
    "attendance.print",
    "grades.view",
    "grades.print",
    "finance.view",
    "invoices.view",
    "invoices.print",
    "payments.view",
    "payments.print",
    "expenses.view",
    "ppdb.view",
    "ppdb.approve",
    "ppdb.reject",
    "ppdb.print",
    "industry-partners.view",
    "internships.view",
    "internship-logs.view",
    "alumni.view",
    "job-vacancies.view",
    "job-applications.view",
    "tracer-studies.view",
    "bkk.view",
    "announcements.view",
    "messages.view",
    "notifications.view",
    "notification-templates.view",
    "reports.view",
    "report-jobs.view",
    "export-history.view",
  ],
  "waka-kurikulum": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "users.view",
    "master-data.view",
    "master-data.create",
    "master-data.update",
    "students.view",
    "teachers.view",
    "teaching-assignments.view",
    "teaching-assignments.manage",
    "schedules.view",
    "schedules.manage",
    "attendance.view",
    "attendance.record",
    "attendance.update",
    "attendance.approve",
    "attendance.print",
    "grades.view",
    "grades.input",
    "grades.update",
    "grades.approve",
    "grades.publish",
    "grades.print",
  ],
  "waka-kesiswaan": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "users.view",
    "users.reset-password",
    "users.unlock",
    "users.force-change-password",
    "master-data.view",
    "students.view",
    "students.create",
    "students.update",
    "guardians.view",
    "guardians.create",
    "guardians.update",
  ],
  guru: [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "master-data.view",
    "students.view",
    "teachers.view",
    "teaching-assignments.view",
    "schedules.view",
    "attendance.view",
    "attendance.record",
    "attendance.print",
    "grades.view",
    "grades.input",
    "grades.print",
    "teacher-portal.view",
    "notifications.view",
    "notifications.read",
  ],
  "wali-kelas": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "users.view",
    "master-data.view",
    "students.view",
    "guardians.view",
    "teachers.view",
    "teaching-assignments.view",
    "schedules.view",
    "attendance.view",
    "attendance.record",
    "attendance.update",
    "attendance.approve",
    "attendance.print",
    "grades.view",
    "grades.input",
    "grades.update",
    "grades.print",
  ],
  siswa: [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "students.view",
    "student-portal.view",
    "notifications.view",
    "notifications.read",
  ],
  "orang-tua-wali": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "students.view",
    "guardians.view",
    "guardian-portal.view",
    "notifications.view",
    "notifications.read",
  ],
  bendahara: [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "master-data.view",
    "staffs.view",
    "finance.view",
    "finance.export",
    "invoices.view",
    "invoices.create",
    "invoices.update",
    "invoices.print",
    "payments.view",
    "payments.create",
    "payments.print",
    "expenses.view",
    "expenses.create",
    "expenses.approve",
    "expenses.pay",
  ],
  "staff-tu": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "users.view",
    "users.create",
    "users.update",
    "users.reset-password",
    "users.unlock",
    "users.force-change-password",
    "master-data.view",
    "master-data.create",
    "master-data.update",
    "master-data.import",
    "master-data.export",
    "students.view",
    "students.create",
    "students.update",
    "students.import",
    "students.export",
    "guardians.view",
    "guardians.create",
    "guardians.update",
    "guardians.import",
    "guardians.export",
    "teachers.view",
    "teachers.create",
    "teachers.update",
    "teachers.import",
    "teachers.export",
    "staffs.view",
    "staffs.create",
    "staffs.update",
    "staffs.import",
    "staffs.export",
    "teaching-assignments.view",
    "teaching-assignments.manage",
    "schedules.view",
    "schedules.manage",
    "attendance.view",
    "attendance.record",
    "attendance.update",
    "attendance.print",
    "grades.view",
    "grades.input",
    "grades.update",
    "grades.print",
    "invoices.view",
    "invoices.print",
    "payments.view",
    "payments.print",
    "ppdb.view",
    "ppdb.print",
    "announcements.view",
    "announcements.create",
    "announcements.update",
    "announcements.publish",
    "announcements.archive",
    "messages.view",
    "messages.send",
    "messages.read",
    "notifications.view",
    "notifications.create",
    "notifications.read",
    "notification-templates.view",
    "letters.view",
    "letters.create",
    "letters.update",
    "letters.print",
    "reports.view",
    "reports.generate",
    "report-jobs.view",
    "report-jobs.create",
    "export-history.view",
  ],
  "panitia-ppdb": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "users.view",
    "users.create",
    "users.update",
    "master-data.view",
    "students.view",
    "ppdb.view",
    "ppdb.create",
    "ppdb.update",
    "ppdb.verify",
    "ppdb.approve",
    "ppdb.reject",
    "ppdb.convert",
    "ppdb.export",
    "ppdb.print",
  ],
  "pembimbing-pkl": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "users.view",
    "master-data.view",
    "students.view",
    "teachers.view",
    "industry-partners.view",
    "internships.view",
    "internships.create",
    "internships.update",
    "internships.start",
    "internships.complete",
    "internships.cancel",
    "internships.score",
    "internship-logs.view",
    "internship-logs.create",
    "internship-logs.update",
    "internship-logs.approve",
    "internship-logs.reject",
  ],
  "admin-bkk": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "users.view",
    "master-data.view",
    "students.view",
    "staffs.view",
    "industry-partners.view",
    "industry-partners.create",
    "industry-partners.update",
    "alumni.view",
    "alumni.create",
    "alumni.update",
    "alumni.convert",
    "job-vacancies.view",
    "job-vacancies.create",
    "job-vacancies.update",
    "job-vacancies.publish",
    "job-vacancies.close",
    "job-applications.view",
    "job-applications.update",
    "job-applications.review",
    "job-applications.accept",
    "job-applications.reject",
    "tracer-studies.view",
    "tracer-studies.create",
    "tracer-studies.update",
    "bkk.view",
    "bkk.export",
    "reports.view",
    "reports.generate",
    "report-jobs.view",
    "report-jobs.create",
    "export-history.view",
  ],
  "konselor-bk": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "counseling.view",
    "counseling.create",
    "counseling.update",
    "counseling.delete",
    "discipline.view",
    "discipline.create",
    "discipline.update",
    "discipline.report",
    "discipline.notify-guardian",
    "discipline.print",
  ],
  "petugas-tata-tertib": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "discipline.view",
    "discipline.create",
    "discipline.update",
    "discipline.delete",
    "discipline.report",
    "discipline.notify-guardian",
    "discipline.print",
    "students.view",
    "guardians.view",
    "notifications.view",
  ],
  "petugas-surat": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "letters.view",
    "letters.create",
    "letters.update",
    "letters.delete",
    "letters.issue",
    "letters.archive",
    "letters.print",
    "letters.report",
    "letters.manage-templates",
    "students.view",
    "teachers.view",
    "staffs.view",
    "guardians.view",
    "reports.view",
    "reports.generate",
    "report-jobs.view",
    "report-jobs.create",
    "export-history.view",
  ],
  "petugas-sarpras": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "inventory.view",
    "inventory.create",
    "inventory.update",
    "inventory.delete",
    "inventory.borrow",
    "inventory.return",
    "inventory.maintenance",
    "inventory.export",
    "inventory.print",
  ],
  "petugas-perpustakaan": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "library.view",
    "library.create",
    "library.update",
    "library.delete",
    "library.borrow",
    "library.return",
    "library.fine",
    "library.export",
    "library.print",
  ],
  "hr-payroll": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "payroll.view",
    "payroll.create",
    "payroll.update",
    "payroll.approve",
    "payroll.pay",
    "payroll.print",
    "payroll.export",
    "teachers.view",
    "staffs.view",
    "reports.view",
    "reports.generate",
    "reports.download",
    "report-jobs.view",
    "report-jobs.create",
    "export-history.view",
  ],
  "petugas-ujian": [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "exams.view",
    "exams.create",
    "exams.update",
    "exams.delete",
    "exams.schedule",
    "exams.participants",
    "exams.print-card",
    "exams.export",
    "students.view",
    "teachers.view",
    "master-data.view",
  ],
  approver: [
    "dashboard.view",
    "auth.change-password",
    "auth.logout-all",
    "auth.login-history",
    "approvals.view",
    "approvals.approve",
    "approvals.reject",
    "approvals.delegate",
    "approvals.history",
    "letters.view",
    "letters.approve",
    "letters.reject",
    "letters.print",
    "payroll.view",
    "payroll.approve",
  ],
};

function permissionGroup(key: string) {
  return key.split(".")[0] ?? "core";
}

const DEFAULT_SUPER_ADMIN_PASSWORD = "ChangeMe123!";

async function main() {
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@nexsmsid.dev";
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? DEFAULT_SUPER_ADMIN_PASSWORD;
  const superAdminName = process.env.SEED_SUPER_ADMIN_NAME ?? "Super Admin NexSMSID";

  if (process.env.NODE_ENV === "production" && superAdminPassword === DEFAULT_SUPER_ADMIN_PASSWORD) {
    throw new Error(
      "Refusing to seed in production with the default super-admin password. " +
        "Set SEED_SUPER_ADMIN_PASSWORD (and SEED_SUPER_ADMIN_EMAIL) to non-default values before seeding.",
    );
  }

  const passwordHash = await bcrypt.hash(superAdminPassword, 12);

  const permissionRecords = new Map<string, string>();

  for (const key of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {
        name: key,
        group: permissionGroup(key),
        description: `Permission ${key}`,
      },
      create: {
        key,
        name: key,
        group: permissionGroup(key),
        description: `Permission ${key}`,
      },
    });

    permissionRecords.set(key, permission.id);
  }

  for (const roleInput of roles) {
    const role = await prisma.role.upsert({
      where: { slug: roleInput.slug },
      update: {
        name: roleInput.name,
        description: roleInput.description,
        isActive: true,
      },
      create: {
        name: roleInput.name,
        slug: roleInput.slug,
        description: roleInput.description,
        isActive: true,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    for (const permissionKey of rolePermissionMap[roleInput.slug] ?? []) {
      const permissionId = permissionRecords.get(permissionKey);

      if (!permissionId) {
        continue;
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId,
        },
      });
    }
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: "super-admin" } });
  // Force rotation whenever the account is (re)seeded with a known password
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      passwordHash,
      status: "ACTIVE",
      deletedAt: null,
      forceChangePassword: true,
    },
    create: {
      email: superAdminEmail,
      name: superAdminName,
      passwordHash,
      status: "ACTIVE",
      forceChangePassword: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  const existingSchoolProfile = await prisma.schoolProfile.findFirst();

  if (existingSchoolProfile) {
    await prisma.schoolProfile.update({
      where: { id: existingSchoolProfile.id },
      data: {
        name: existingSchoolProfile.name || "NexSMSID School",
      },
    });
  } else {
    await prisma.schoolProfile.create({
      data: {
        name: "NexSMSID School",
        description: "Profil sekolah awal untuk Phase 5.",
      },
    });
  }

  await seedMasterData();
  await seedPeopleManagement();
  await seedAcademicPhase7();
  await seedFinanceAndPpdb();
  await seedPhase9PklBkk();
  await seedPhase10CommunicationReports();
  await seedPortalUsers(superAdminPassword);
  await seedPhase121BkDiscipline();
  await seedPhase122LetterManagement();
  await seedPhase123InventorySarpras(superAdmin.id);
  await seedHRManagement(superAdmin.id);
  await seedPayroll(superAdmin.id);
  await seedExams(superAdmin.id);
  await seedCounseling();

  await prisma.auditLog.create({
    data: {
      actorId: superAdmin.id,
      action: "seed.people_management",
      entity: "system",
      metadata: {
        roles: roles.length,
        permissions: permissions.length,
        superAdminEmail,
      },
    },
  });

  console.log(`Seed completed. Super admin: ${superAdminEmail}`);
}

async function seedPortalUsers(defaultPassword: string) {
  const guruRole = await prisma.role.findUnique({ where: { slug: "guru" } });
  const siswaRole = await prisma.role.findUnique({ where: { slug: "siswa" } });
  const waliRole = await prisma.role.findUnique({ where: { slug: "orang-tua-wali" } });

  if (!guruRole || !siswaRole || !waliRole) {
    console.log("Phase 10.4 portal user seed: missing required roles, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const teacher1 = await prisma.teacher.findUnique({ where: { id: "seed-teacher-1" } });
  const studentAktif = await prisma.student.findFirst({
    where: { deletedAt: null, status: "ACTIVE" as any },
    orderBy: { createdAt: "asc" },
  });
  const guardianAyah = await prisma.guardian.findUnique({ where: { id: "seed-guardian-ayah" } });

  if (!teacher1 || !studentAktif || !guardianAyah) {
    console.log("Phase 10.4 portal user seed: missing teacher/student/guardian data, skipping.");
    return;
  }

  const guruUser = await prisma.user.upsert({
    where: { email: "guru@nexsmsid.dev" },
    update: { name: teacher1.name, passwordHash, status: "ACTIVE", forceChangePassword: true, deletedAt: null },
    create: {
      email: "guru@nexsmsid.dev",
      name: teacher1.name,
      passwordHash,
      status: "ACTIVE",
      forceChangePassword: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: guruUser.id, roleId: guruRole.id } },
    update: {},
    create: { userId: guruUser.id, roleId: guruRole.id },
  });
  await prisma.teacher.update({
    where: { id: teacher1.id },
    data: { userId: guruUser.id },
  });

  const siswaUser = await prisma.user.upsert({
    where: { email: "siswa@nexsmsid.dev" },
    update: { name: studentAktif.name, passwordHash, status: "ACTIVE", forceChangePassword: true, deletedAt: null },
    create: {
      email: "siswa@nexsmsid.dev",
      name: studentAktif.name,
      passwordHash,
      status: "ACTIVE",
      forceChangePassword: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: siswaUser.id, roleId: siswaRole.id } },
    update: {},
    create: { userId: siswaUser.id, roleId: siswaRole.id },
  });
  await prisma.student.update({
    where: { id: studentAktif.id },
    data: { userId: siswaUser.id, email: siswaUser.email },
  });
  const existingLink = await prisma.studentGuardian.findFirst({
    where: { studentId: studentAktif.id, guardianId: guardianAyah.id },
  });
  if (!existingLink) {
    await prisma.studentGuardian.create({
      data: { studentId: studentAktif.id, guardianId: guardianAyah.id, isPrimary: true },
    });
  }

  const waliUser = await prisma.user.upsert({
    where: { email: "wali@nexsmsid.dev" },
    update: { name: guardianAyah.name, passwordHash, status: "ACTIVE", forceChangePassword: true, deletedAt: null },
    create: {
      email: "wali@nexsmsid.dev",
      name: guardianAyah.name,
      passwordHash,
      status: "ACTIVE",
      forceChangePassword: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: waliUser.id, roleId: waliRole.id } },
    update: {},
    create: { userId: waliUser.id, roleId: waliRole.id },
  });
  await prisma.guardian.update({
    where: { id: guardianAyah.id },
    data: { userId: waliUser.id, email: waliUser.email },
  });

  console.log("Phase 10.4 portal users seeded (guru/siswa/wali).");
}

async function seedMasterData() {
  const ay = await prisma.academicYear.upsert({
    where: { id: "seed-ay-2025" },
    update: {},
    create: {
      id: "seed-ay-2025",
      name: "2025/2026",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-06-30"),
      isActive: true,
    },
  });

  const sem = await prisma.semester.upsert({
    where: { id: "seed-sem-1" },
    update: {},
    create: {
      id: "seed-sem-1",
      academicYearId: ay.id,
      name: "Ganjil",
      order: 1,
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
    },
  });

  const dept = await prisma.department.upsert({
    where: { id: "seed-dept-tkr" },
    update: {},
    create: {
      id: "seed-dept-tkr",
      code: "TKR",
      name: "Teknik Kendaraan Ringan",
      description: "Jurusan Teknik Kendaraan Ringan",
    },
  });

  const comp = await prisma.competency.upsert({
    where: { id: "seed-comp-tkr" },
    update: {},
    create: {
      id: "seed-comp-tkr",
      departmentId: dept.id,
      code: "PMKR",
      name: "Pemeliharaan Mesin Kendaraan Ringan",
      description: "Konsentrasi Pemeliharaan Mesin Kendaraan Ringan",
    },
  });

  const room = await prisma.room.upsert({
    where: { id: "seed-room-1" },
    update: {},
    create: {
      id: "seed-room-1",
      code: "RK-10A",
      name: "Ruang Kelas X A",
      type: "KAMPUS",
      capacity: 36,
      isActive: true,
    },
  });

  const classroom = await prisma.classroom.upsert({
    where: { id: "seed-class-1" },
    update: {},
    create: {
      id: "seed-class-1",
      competencyId: comp.id,
      code: "10-TKR-A",
      name: "Kelas X TKR A",
      level: 10,
      isActive: true,
    },
  });

  const subject1 = await prisma.subject.upsert({
    where: { id: "seed-subj-mat" },
    update: {},
    create: {
      id: "seed-subj-mat",
      code: "MAT",
      name: "Matematika",
      group: "A",
      isActive: true,
    },
  });

  const subject2 = await prisma.subject.upsert({
    where: { id: "seed-subj-ind" },
    update: {},
    create: {
      id: "seed-subj-ind",
      code: "IND",
      name: "Bahasa Indonesia",
      group: "A",
      isActive: true,
    },
  });

  await prisma.lessonHour.upsert({
    where: { id: "seed-lh-1" },
    update: {},
    create: {
      id: "seed-lh-1",
      name: "Jam 1",
      order: 1,
      startTime: "07:00",
      endTime: "08:00",
      isActive: true,
    },
  });

  await prisma.lessonHour.upsert({
    where: { id: "seed-lh-2" },
    update: {},
    create: {
      id: "seed-lh-2",
      name: "Jam 2",
      order: 2,
      startTime: "08:00",
      endTime: "09:00",
      isActive: true,
    },
  });
}

async function seedPeopleManagement() {
  const classroom = await prisma.classroom.findFirst({ where: { deletedAt: null } });

  const guardianA = await prisma.guardian.upsert({
    where: { id: "seed-guardian-ayah" },
    update: {
      name: "Budi Santoso",
      relation: "FATHER",
      phone: "081234567890",
      email: "budi.santoso@example.com",
      occupation: "Karyawan Swasta",
      address: "Jl. Merdeka No. 1, Jakarta",
    },
    create: {
      id: "seed-guardian-ayah",
      name: "Budi Santoso",
      relation: "FATHER",
      phone: "081234567890",
      email: "budi.santoso@example.com",
      occupation: "Karyawan Swasta",
      address: "Jl. Merdeka No. 1, Jakarta",
    },
  });

  const guardianB = await prisma.guardian.upsert({
    where: { id: "seed-guardian-ibu" },
    update: {
      name: "Sari Wulandari",
      relation: "MOTHER",
      phone: "081234567891",
      email: "sari.wulandari@example.com",
      occupation: "Ibu Rumah Tangga",
      address: "Jl. Sudirman No. 2, Bandung",
    },
    create: {
      id: "seed-guardian-ibu",
      name: "Sari Wulandari",
      relation: "MOTHER",
      phone: "081234567891",
      email: "sari.wulandari@example.com",
      occupation: "Ibu Rumah Tangga",
      address: "Jl. Sudirman No. 2, Bandung",
    },
  });

  const studentA = await prisma.student.upsert({
    where: { nis: "20260001" },
    update: {
      nisn: "1234567890",
      name: "Andi Pratama",
      gender: "MALE",
      birthPlace: "Jakarta",
      birthDate: new Date("2008-05-12"),
      address: "Jl. Merdeka No. 1, Jakarta",
      phone: "081298765432",
      email: "andi.pratama@example.com",
      classroomId: classroom?.id ?? null,
      status: "ACTIVE",
      enrolledAt: new Date("2024-07-15"),
    },
    create: {
      nis: "20260001",
      nisn: "1234567890",
      name: "Andi Pratama",
      gender: "MALE",
      birthPlace: "Jakarta",
      birthDate: new Date("2008-05-12"),
      address: "Jl. Merdeka No. 1, Jakarta",
      phone: "081298765432",
      email: "andi.pratama@example.com",
      classroomId: classroom?.id ?? null,
      status: "ACTIVE",
      enrolledAt: new Date("2024-07-15"),
    },
  });

  await prisma.student.upsert({
    where: { nis: "20260002" },
    update: {
      nisn: "1234567891",
      name: "Citra Lestari",
      gender: "FEMALE",
      birthPlace: "Bandung",
      birthDate: new Date("2008-09-20"),
      address: "Jl. Sudirman No. 2, Bandung",
      phone: "081298765433",
      email: "citra.lestari@example.com",
      classroomId: classroom?.id ?? null,
      status: "ACTIVE",
      enrolledAt: new Date("2024-07-15"),
    },
    create: {
      nis: "20260002",
      nisn: "1234567891",
      name: "Citra Lestari",
      gender: "FEMALE",
      birthPlace: "Bandung",
      birthDate: new Date("2008-09-20"),
      address: "Jl. Sudirman No. 2, Bandung",
      phone: "081298765433",
      email: "citra.lestari@example.com",
      classroomId: classroom?.id ?? null,
      status: "ACTIVE",
      enrolledAt: new Date("2024-07-15"),
    },
  });

  await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: studentA.id, guardianId: guardianA.id } },
    update: { isPrimary: true },
    create: { studentId: studentA.id, guardianId: guardianA.id, isPrimary: true },
  });

  await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: studentA.id, guardianId: guardianB.id } },
    update: { isPrimary: false },
    create: { studentId: studentA.id, guardianId: guardianB.id, isPrimary: false },
  });

  await prisma.teacher.upsert({
    where: { id: "seed-teacher-1" },
    update: {
      nip: "198501012010011001",
      nuptk: "1234567890123456",
      name: "Dewi Anggraini, S.Pd",
      gender: "FEMALE",
      birthPlace: "Yogyakarta",
      birthDate: new Date("1985-01-01"),
      phone: "081355511222",
      email: "dewi.anggraini@example.com",
      address: "Jl. Malioboro No. 10, Yogyakarta",
      employmentStatus: "PERMANENT",
      status: "ACTIVE",
    },
    create: {
      id: "seed-teacher-1",
      nip: "198501012010011001",
      nuptk: "1234567890123456",
      name: "Dewi Anggraini, S.Pd",
      gender: "FEMALE",
      birthPlace: "Yogyakarta",
      birthDate: new Date("1985-01-01"),
      phone: "081355511222",
      email: "dewi.anggraini@example.com",
      address: "Jl. Malioboro No. 10, Yogyakarta",
      employmentStatus: "PERMANENT",
      status: "ACTIVE",
    },
  });

  await prisma.teacher.upsert({
    where: { id: "seed-teacher-2" },
    update: {
      nip: "199003152015021002",
      name: "Rian Hidayat, M.Pd",
      gender: "MALE",
      birthPlace: "Surabaya",
      birthDate: new Date("1990-03-15"),
      phone: "081355533444",
      email: "rian.hidayat@example.com",
      address: "Jl. Tunjungan No. 5, Surabaya",
      employmentStatus: "CONTRACT",
      status: "ACTIVE",
    },
    create: {
      id: "seed-teacher-2",
      nip: "199003152015021002",
      name: "Rian Hidayat, M.Pd",
      gender: "MALE",
      birthPlace: "Surabaya",
      birthDate: new Date("1990-03-15"),
      phone: "081355533444",
      email: "rian.hidayat@example.com",
      address: "Jl. Tunjungan No. 5, Surabaya",
      employmentStatus: "CONTRACT",
      status: "ACTIVE",
    },
  });

  await prisma.staff.upsert({
    where: { id: "seed-staff-1" },
    update: {
      nip: "198002022005011003",
      name: "Hartono",
      gender: "MALE",
      phone: "081366611000",
      email: "hartono@example.com",
      address: "Jl. Diponegoro No. 3, Semarang",
      position: "Kepala Tata Usaha",
      department: "Tata Usaha",
      employmentStatus: "PERMANENT",
      status: "ACTIVE",
    },
    create: {
      id: "seed-staff-1",
      nip: "198002022005011003",
      name: "Hartono",
      gender: "MALE",
      phone: "081366611000",
      email: "hartono@example.com",
      address: "Jl. Diponegoro No. 3, Semarang",
      position: "Kepala Tata Usaha",
      department: "Tata Usaha",
      employmentStatus: "PERMANENT",
      status: "ACTIVE",
    },
  });

  await prisma.staff.upsert({
    where: { id: "seed-staff-2" },
    update: {
      name: "Lina Marlina",
      gender: "FEMALE",
      phone: "081366622111",
      email: "lina.marlina@example.com",
      address: "Jl. Asia Afrika No. 8, Bandung",
      position: "Staf Bendahara",
      department: "Keuangan",
      employmentStatus: "PERMANENT",
      status: "ACTIVE",
    },
    create: {
      id: "seed-staff-2",
      name: "Lina Marlina",
      gender: "FEMALE",
      phone: "081366622111",
      email: "lina.marlina@example.com",
      address: "Jl. Asia Afrika No. 8, Bandung",
      position: "Staf Bendahara",
      department: "Keuangan",
      employmentStatus: "PERMANENT",
      status: "ACTIVE",
    },
  });
}

async function seedAcademicPhase7() {
  const teacher1 = await prisma.teacher.findUnique({ where: { id: "seed-teacher-1" } });
  const teacher2 = await prisma.teacher.findUnique({ where: { id: "seed-teacher-2" } });
  const classroom = await prisma.classroom.findFirst({ where: { deletedAt: null } });
  const subjects = await prisma.subject.findMany({ where: { deletedAt: null } });
  const semesters = await prisma.semester.findMany({ where: { deletedAt: null } });
  const lessonHours = await prisma.lessonHour.findMany({ where: { isActive: true }, orderBy: { startTime: "asc" } });
  const rooms = await prisma.room.findMany({ where: { deletedAt: null } });

  if (!teacher1 || !teacher2 || !classroom || subjects.length < 2 || !semesters.length || lessonHours.length < 2 || rooms.length < 1) {
    console.log("Phase 7 seed: missing prerequisite data, skipping sample data.");
    return;
  }

  const semester = semesters[0];
  const subject1 = subjects[0];
  const subject2 = subjects[1];
  const room = rooms[0];
  const lh1 = lessonHours[0];
  const lh2 = lessonHours[1];

  const ta1 = await prisma.teachingAssignment.upsert({
    where: { id: "seed-ta-1" },
    update: {
      teacherId: teacher1.id,
      subjectId: subject1.id,
      classroomId: classroom.id,
      academicYearId: semester.academicYearId,
      semesterId: semester.id,
      isActive: true,
    },
    create: {
      id: "seed-ta-1",
      teacherId: teacher1.id,
      subjectId: subject1.id,
      classroomId: classroom.id,
      academicYearId: semester.academicYearId,
      semesterId: semester.id,
      isActive: true,
    },
  });

  const ta2 = await prisma.teachingAssignment.upsert({
    where: { id: "seed-ta-2" },
    update: {
      teacherId: teacher2.id,
      subjectId: subject2.id,
      classroomId: classroom.id,
      academicYearId: semester.academicYearId,
      semesterId: semester.id,
      isActive: true,
    },
    create: {
      id: "seed-ta-2",
      teacherId: teacher2.id,
      subjectId: subject2.id,
      classroomId: classroom.id,
      academicYearId: semester.academicYearId,
      semesterId: semester.id,
      isActive: true,
    },
  });

  await prisma.schedule.upsert({
    where: { id: "seed-schedule-1" },
    update: {
      teachingAssignmentId: ta1.id,
      dayOfWeek: "MONDAY",
      lessonHourId: lh1.id,
      roomId: room.id,
      isActive: true,
    },
    create: {
      id: "seed-schedule-1",
      teachingAssignmentId: ta1.id,
      dayOfWeek: "MONDAY",
      lessonHourId: lh1.id,
      roomId: room.id,
      isActive: true,
    },
  });

  await prisma.schedule.upsert({
    where: { id: "seed-schedule-2" },
    update: {
      teachingAssignmentId: ta2.id,
      dayOfWeek: "WEDNESDAY",
      lessonHourId: lh2.id,
      roomId: room.id,
      isActive: true,
    },
    create: {
      id: "seed-schedule-2",
      teachingAssignmentId: ta2.id,
      dayOfWeek: "WEDNESDAY",
      lessonHourId: lh2.id,
      roomId: room.id,
      isActive: true,
    },
  });

  const schedule1 = await prisma.schedule.findUnique({ where: { id: "seed-schedule-1" } });
  const students = await prisma.student.findMany({ where: { classroomId: classroom.id, deletedAt: null } });

  if (schedule1 && students.length > 0) {
    const session = await prisma.attendanceSession.upsert({
      where: { id: "seed-attendance-session-1" },
      update: {
        scheduleId: schedule1.id,
        date: new Date("2026-06-01"),
        notes: "Seed attendance session",
      },
      create: {
        id: "seed-attendance-session-1",
        scheduleId: schedule1.id,
        date: new Date("2026-06-01"),
        notes: "Seed attendance session",
      },
    });

    for (const student of students) {
      await prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } },
        update: { status: "PRESENT" },
        create: { sessionId: session.id, studentId: student.id, status: "PRESENT" },
      });
    }

    const assessment1 = await prisma.assessment.upsert({
      where: { id: "seed-assessment-1" },
      update: {
        teachingAssignmentId: ta1.id,
        type: "QUIZ",
        name: "Quiz 1 - Matematika",
        description: "Quiz pertama semester ini",
        maxScore: 100,
        weight: 10,
        dueDate: new Date("2026-06-15"),
      },
      create: {
        id: "seed-assessment-1",
        teachingAssignmentId: ta1.id,
        type: "QUIZ",
        name: "Quiz 1 - Matematika",
        description: "Quiz pertama semester ini",
        maxScore: 100,
        weight: 10,
        dueDate: new Date("2026-06-15"),
      },
    });

    const assessment2 = await prisma.assessment.upsert({
      where: { id: "seed-assessment-2" },
      update: {
        teachingAssignmentId: ta1.id,
        type: "MIDTERM",
        name: "UTS Matematika",
        description: "Ujian Tengah Semester",
        maxScore: 100,
        weight: 30,
        dueDate: new Date("2026-07-01"),
      },
      create: {
        id: "seed-assessment-2",
        teachingAssignmentId: ta1.id,
        type: "MIDTERM",
        name: "UTS Matematika",
        description: "Ujian Tengah Semester",
        maxScore: 100,
        weight: 30,
        dueDate: new Date("2026-07-01"),
      },
    });

    for (const student of students) {
      const score1 = Math.floor(Math.random() * 30) + 70;
      const score2 = Math.floor(Math.random() * 30) + 70;

      await prisma.grade.upsert({
        where: { assessmentId_studentId: { assessmentId: assessment1.id, studentId: student.id } },
        update: { score: score1, status: "SUBMITTED" },
        create: { assessmentId: assessment1.id, studentId: student.id, score: score1, status: "SUBMITTED" },
      });

      await prisma.grade.upsert({
        where: { assessmentId_studentId: { assessmentId: assessment2.id, studentId: student.id } },
        update: { score: score2, status: "SUBMITTED" },
        create: { assessmentId: assessment2.id, studentId: student.id, score: score2, status: "SUBMITTED" },
      });
    }
  }

  console.log("Phase 7 academic data seeded.");
}

async function seedFinanceAndPpdb() {
  await prisma.ppdbRegistration.updateMany({
    where: { id: "seed-ppdb-reg-2" },
    data: { convertedStudentId: null },
  });

  await prisma.student.deleteMany({ where: { nis: "PPDB-06-00002" } });

  const students = await prisma.student.findMany({ where: { deletedAt: null } });
  const academicYears = await prisma.academicYear.findMany({ where: { deletedAt: null } });
  const semesters = await prisma.semester.findMany({ where: { deletedAt: null } });
  const departments = await prisma.department.findMany({ where: { deletedAt: null } });
  const superAdmin = await prisma.user.findFirst({ where: { email: process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@nexsmsid.dev" } });

  if (!students.length || !academicYears.length || !semesters.length || !superAdmin) {
    console.log("Phase 8 seed: missing prerequisite data, skipping sample data.");
    return;
  }

  const student1 = students[0];
  const student2 = students.length > 1 ? students[1] : students[0];
  const year = academicYears[0];
  const semester = semesters[0];

  const invoice1 = await prisma.invoice.upsert({
    where: { id: "seed-invoice-1" },
    update: {
      studentId: student1.id,
      academicYearId: year.id,
      semesterId: semester.id,
      subtotal: 500000,
      total: 500000,
      paidAmount: 500000,
      status: "PAID",
      note: "SPP Bulan Juli 2026",
    },
    create: {
      id: "seed-invoice-1",
      invoiceNumber: "INV-202606-00001",
      studentId: student1.id,
      academicYearId: year.id,
      semesterId: semester.id,
      issueDate: new Date("2026-06-01"),
      dueDate: new Date("2026-07-10"),
      subtotal: 500000,
      total: 500000,
      paidAmount: 500000,
      status: "PAID",
      note: "SPP Bulan Juli 2026",
    },
  });

  await prisma.invoiceItem.upsert({
    where: { id: "seed-invoice-item-1" },
    update: { invoiceId: invoice1.id, name: "SPP Bulan Juli 2026", quantity: 1, unitPrice: 300000, total: 300000 },
    create: {
      id: "seed-invoice-item-1",
      invoiceId: invoice1.id,
      name: "SPP Bulan Juli 2026",
      quantity: 1,
      unitPrice: 300000,
      total: 300000,
    },
  });

  await prisma.invoiceItem.upsert({
    where: { id: "seed-invoice-item-2" },
    update: { invoiceId: invoice1.id, name: "Biaya Kegiatan", quantity: 1, unitPrice: 200000, total: 200000 },
    create: { id: "seed-invoice-item-2", invoiceId: invoice1.id, name: "Biaya Kegiatan", quantity: 1, unitPrice: 200000, total: 200000 },
  });

  const invoice2 = await prisma.invoice.upsert({
    where: { id: "seed-invoice-2" },
    update: {
      studentId: student2.id,
      academicYearId: year.id,
      semesterId: semester.id,
      subtotal: 350000,
      total: 350000,
      paidAmount: 0,
      status: "DRAFT",
    },
    create: {
      id: "seed-invoice-2",
      invoiceNumber: "INV-202606-00002",
      studentId: student2.id,
      academicYearId: year.id,
      semesterId: semester.id,
      issueDate: new Date("2026-06-01"),
      dueDate: new Date("2026-07-10"),
      subtotal: 350000,
      total: 350000,
      paidAmount: 0,
      status: "DRAFT",
      note: "Tagihan LKS",
    },
  });

  await prisma.invoiceItem.upsert({
    where: { id: "seed-invoice-item-3" },
    update: { invoiceId: invoice2.id, name: "LKS Matematika", quantity: 1, unitPrice: 150000, total: 150000 },
    create: { id: "seed-invoice-item-3", invoiceId: invoice2.id, name: "LKS Matematika", quantity: 1, unitPrice: 150000, total: 150000 },
  });

  await prisma.invoiceItem.upsert({
    where: { id: "seed-invoice-item-4" },
    update: { invoiceId: invoice2.id, name: "LKS Bahasa Indonesia", quantity: 1, unitPrice: 200000, total: 200000 },
    create: {
      id: "seed-invoice-item-4",
      invoiceId: invoice2.id,
      name: "LKS Bahasa Indonesia",
      quantity: 1,
      unitPrice: 200000,
      total: 200000,
    },
  });

  await prisma.payment.upsert({
    where: { id: "seed-payment-1" },
    update: {
      invoiceId: invoice1.id,
      amount: 500000,
      method: "BANK_TRANSFER",
      status: "VERIFIED",
      paidAt: new Date("2026-06-05"),
      verifiedById: superAdmin.id,
      verifiedAt: new Date("2026-06-05"),
    },
    create: {
      id: "seed-payment-1",
      paymentNumber: "PAY-202606-00001",
      invoiceId: invoice1.id,
      amount: 500000,
      method: "BANK_TRANSFER",
      status: "VERIFIED",
      paidAt: new Date("2026-06-05"),
      verifiedById: superAdmin.id,
      verifiedAt: new Date("2026-06-05"),
      note: "Pembayaran lunas",
    },
  });

  await prisma.payment.upsert({
    where: { id: "seed-payment-2" },
    update: { invoiceId: invoice1.id, amount: 300000, method: "CASH", status: "PENDING", paidAt: new Date("2026-06-10") },
    create: {
      id: "seed-payment-2",
      paymentNumber: "PAY-202606-00002",
      invoiceId: invoice1.id,
      amount: 300000,
      method: "CASH",
      status: "PENDING",
      paidAt: new Date("2026-06-10"),
    },
  });

  await prisma.expense.upsert({
    where: { id: "seed-expense-1" },
    update: {
      title: "Listrik Bulan Juni",
      category: "Utilitas",
      amount: 1500000,
      date: new Date("2026-06-01"),
      status: "PAID",
      approvedById: superAdmin.id,
    },
    create: {
      id: "seed-expense-1",
      expenseNumber: "EXP-202606-00001",
      title: "Listrik Bulan Juni",
      category: "Utilitas",
      amount: 1500000,
      date: new Date("2026-06-01"),
      status: "PAID",
      approvedById: superAdmin.id,
    },
  });

  await prisma.expense.upsert({
    where: { id: "seed-expense-2" },
    update: {
      title: "ATK Kantor",
      category: "Perlengkapan",
      amount: 500000,
      date: new Date("2026-06-03"),
      status: "APPROVED",
      approvedById: superAdmin.id,
    },
    create: {
      id: "seed-expense-2",
      expenseNumber: "EXP-202606-00002",
      title: "ATK Kantor",
      category: "Perlengkapan",
      amount: 500000,
      date: new Date("2026-06-03"),
      status: "APPROVED",
      approvedById: superAdmin.id,
    },
  });

  const period = await prisma.ppdbPeriod.upsert({
    where: { id: "seed-ppdb-period-1" },
    update: {
      name: "PPDB Gelombang 1 TA 2026/2027",
      academicYearId: year.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-07-31"),
      isActive: true,
      quota: 100,
    },
    create: {
      id: "seed-ppdb-period-1",
      name: "PPDB Gelombang 1 TA 2026/2027",
      academicYearId: year.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-07-31"),
      isActive: true,
      quota: 100,
    },
  });

  const legacyDemoPinHash = await bcrypt.hash("123456", 12);

  const reg1 = await prisma.ppdbRegistration.upsert({
    where: { id: "seed-ppdb-reg-1" },
    update: {
      periodId: period.id,
      name: "Bambang Suprapto",
      gender: "MALE",
      phone: "081111222333",
      status: "SUBMITTED",
      accessPinHash: legacyDemoPinHash,
    },
    create: {
      id: "seed-ppdb-reg-1",
      registrationNumber: "REG-202606-00001",
      periodId: period.id,
      name: "Bambang Suprapto",
      gender: "MALE",
      phone: "081111222333",
      accessPinHash: legacyDemoPinHash,
      status: "SUBMITTED",
      selectionStatus: "PENDING",
      previousSchool: "SMP Negeri 1 Jakarta",
    },
  });

  const reg2 = await prisma.ppdbRegistration.upsert({
    where: { id: "seed-ppdb-reg-2" },
    update: {
      periodId: period.id,
      name: "Siti Rahmawati",
      gender: "FEMALE",
      phone: "081111222334",
      status: "ACCEPTED",
      selectionStatus: "PASSED",
      verifiedById: superAdmin.id,
      verifiedAt: new Date("2026-06-10"),
      convertedStudentId: null,
    },
    create: {
      id: "seed-ppdb-reg-2",
      registrationNumber: "REG-202606-00002",
      periodId: period.id,
      name: "Siti Rahmawati",
      gender: "FEMALE",
      phone: "081111222334",
      status: "ACCEPTED",
      selectionStatus: "PASSED",
      previousSchool: "SDIT Al-Azhar",
      verifiedById: superAdmin.id,
      verifiedAt: new Date("2026-06-10"),
      selectedDepartmentId: departments[0]?.id ?? null,
    },
  });

  await prisma.ppdbDocument.upsert({
    where: { id: "seed-ppdb-doc-1" },
    update: { registrationId: reg1.id, name: "Akte Kelahiran", fileUrl: "/uploads/ppdb/akte-bambang.pdf", status: "PENDING" },
    create: {
      id: "seed-ppdb-doc-1",
      registrationId: reg1.id,
      name: "Akte Kelahiran",
      fileUrl: "/uploads/ppdb/akte-bambang.pdf",
      status: "PENDING",
    },
  });

  await prisma.ppdbDocument.upsert({
    where: { id: "seed-ppdb-doc-2" },
    update: { registrationId: reg2.id, name: "Kartu Keluarga", fileUrl: "/uploads/ppdb/kk-siti.pdf", status: "VERIFIED" },
    create: {
      id: "seed-ppdb-doc-2",
      registrationId: reg2.id,
      name: "Kartu Keluarga",
      fileUrl: "/uploads/ppdb/kk-siti.pdf",
      status: "VERIFIED",
    },
  });

  await prisma.ppdbStatusHistory.deleteMany({ where: { registrationId: { in: [reg1.id, reg2.id] } } });

  await prisma.ppdbStatusHistory.create({
    data: { registrationId: reg1.id, fromStatus: null, toStatus: "SUBMITTED" },
  });

  await prisma.ppdbStatusHistory.create({
    data: { registrationId: reg2.id, fromStatus: null, toStatus: "SUBMITTED" },
  });

  await prisma.ppdbStatusHistory.create({
    data: { registrationId: reg2.id, fromStatus: "SUBMITTED", toStatus: "VERIFIED", changedById: superAdmin.id },
  });

  await prisma.ppdbStatusHistory.create({
    data: { registrationId: reg2.id, fromStatus: "VERIFIED", toStatus: "ACCEPTED", changedById: superAdmin.id },
  });

  console.log("Phase 8 finance and PPDB data seeded.");
}

async function seedPhase9PklBkk() {
  const students = await prisma.student.findMany({ where: { deletedAt: null }, orderBy: { nis: "asc" } });
  const teachers = await prisma.teacher.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });

  if (students.length < 2 || !teachers.length) {
    console.log("Phase 9 seed: missing prerequisite data, skipping sample data.");
    return;
  }

  const student1 = students[0];
  const student2 = students[1];
  const teacher = teachers[0];

  await prisma.jobApplication.deleteMany({ where: { applicantEmail: "phase9-applicant@nexsmsid.dev" } });
  await prisma.alumni.deleteMany({ where: { studentId: student2.id } });
  await prisma.student.update({ where: { id: student2.id }, data: { status: "ACTIVE" } });

  const partner1 = await prisma.industryPartner.upsert({
    where: { id: "seed-industry-partner-1" },
    update: {
      name: "PT Maju Motor Indonesia",
      type: "Otomotif",
      contactPerson: "Doni Setiawan",
      phone: "0215550101",
      email: "hrd@majumotor.test",
      address: "Kawasan Industri Pulogadung",
      website: "https://majumotor.test",
      status: "ACTIVE",
      note: "Mitra PKL utama jurusan TKR",
      deletedAt: null,
    },
    create: {
      id: "seed-industry-partner-1",
      name: "PT Maju Motor Indonesia",
      type: "Otomotif",
      contactPerson: "Doni Setiawan",
      phone: "0215550101",
      email: "hrd@majumotor.test",
      address: "Kawasan Industri Pulogadung",
      website: "https://majumotor.test",
      status: "ACTIVE",
      note: "Mitra PKL utama jurusan TKR",
    },
  });

  const partner2 = await prisma.industryPartner.upsert({
    where: { id: "seed-industry-partner-2" },
    update: {
      name: "CV Digital Nusantara",
      type: "Teknologi",
      contactPerson: "Rina Kurnia",
      phone: "0225550102",
      email: "career@digitalnusantara.test",
      address: "Jl. Teknologi No. 9 Bandung",
      website: "https://digitalnusantara.test",
      status: "ACTIVE",
      note: "Mitra lowongan kerja dan magang IT",
      deletedAt: null,
    },
    create: {
      id: "seed-industry-partner-2",
      name: "CV Digital Nusantara",
      type: "Teknologi",
      contactPerson: "Rina Kurnia",
      phone: "0225550102",
      email: "career@digitalnusantara.test",
      address: "Jl. Teknologi No. 9 Bandung",
      website: "https://digitalnusantara.test",
      status: "ACTIVE",
      note: "Mitra lowongan kerja dan magang IT",
    },
  });

  const internship1 = await prisma.internship.upsert({
    where: { id: "seed-internship-1" },
    update: {
      studentId: student1.id,
      industryPartnerId: partner1.id,
      supervisorTeacherId: teacher.id,
      title: "PKL Bengkel Otomotif",
      startDate: new Date("2026-01-12"),
      endDate: new Date("2026-04-12"),
      status: "PLANNED",
      finalScore: null,
      note: "Rencana PKL siswa di bengkel rekanan",
      deletedAt: null,
    },
    create: {
      id: "seed-internship-1",
      studentId: student1.id,
      industryPartnerId: partner1.id,
      supervisorTeacherId: teacher.id,
      title: "PKL Bengkel Otomotif",
      startDate: new Date("2026-01-12"),
      endDate: new Date("2026-04-12"),
      status: "PLANNED",
      note: "Rencana PKL siswa di bengkel rekanan",
    },
  });

  const internship2 = await prisma.internship.upsert({
    where: { id: "seed-internship-2" },
    update: {
      studentId: student2.id,
      industryPartnerId: partner2.id,
      supervisorTeacherId: teacher.id,
      title: "PKL Administrasi Digital",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-05-01"),
      status: "ONGOING",
      finalScore: 86,
      note: "PKL berjalan di divisi operasional digital",
      deletedAt: null,
    },
    create: {
      id: "seed-internship-2",
      studentId: student2.id,
      industryPartnerId: partner2.id,
      supervisorTeacherId: teacher.id,
      title: "PKL Administrasi Digital",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-05-01"),
      status: "ONGOING",
      finalScore: 86,
      note: "PKL berjalan di divisi operasional digital",
    },
  });

  await prisma.internshipLog.upsert({
    where: { id: "seed-internship-log-1" },
    update: {
      internshipId: internship1.id,
      date: new Date("2026-01-13"),
      activity: "Orientasi tempat PKL dan pengenalan SOP bengkel",
      obstacle: null,
      solution: null,
      status: "SUBMITTED",
      reviewedById: null,
      reviewedAt: null,
      note: null,
    },
    create: {
      id: "seed-internship-log-1",
      internshipId: internship1.id,
      date: new Date("2026-01-13"),
      activity: "Orientasi tempat PKL dan pengenalan SOP bengkel",
      status: "SUBMITTED",
    },
  });

  await prisma.internshipLog.upsert({
    where: { id: "seed-internship-log-2" },
    update: {
      internshipId: internship2.id,
      date: new Date("2026-02-08"),
      activity: "Membantu input data pelanggan dan arsip servis",
      obstacle: "Adaptasi aplikasi internal",
      solution: "Didampingi staf administrasi",
      status: "APPROVED",
      reviewedById: null,
      reviewedAt: new Date("2026-02-09"),
      note: "Aktivitas sesuai target",
    },
    create: {
      id: "seed-internship-log-2",
      internshipId: internship2.id,
      date: new Date("2026-02-08"),
      activity: "Membantu input data pelanggan dan arsip servis",
      obstacle: "Adaptasi aplikasi internal",
      solution: "Didampingi staf administrasi",
      status: "APPROVED",
      reviewedAt: new Date("2026-02-09"),
      note: "Aktivitas sesuai target",
    },
  });

  await prisma.internshipScore.upsert({
    where: { internshipId: internship2.id },
    update: {
      disciplineScore: 88,
      skillScore: 84,
      attitudeScore: 90,
      reportScore: 82,
      finalScore: 86,
      assessedById: null,
      note: "Nilai sementara baik",
    },
    create: {
      id: "seed-internship-score-1",
      internshipId: internship2.id,
      disciplineScore: 88,
      skillScore: 84,
      attitudeScore: 90,
      reportScore: 82,
      finalScore: 86,
      note: "Nilai sementara baik",
    },
  });

  await prisma.student.update({ where: { id: student1.id }, data: { status: "GRADUATED" } });

  const alumni1 = await prisma.alumni.upsert({
    where: { id: "seed-alumni-1" },
    update: {
      studentId: student1.id,
      nis: student1.nis,
      name: student1.name,
      graduationYear: 2025,
      phone: student1.phone,
      email: student1.email,
      address: student1.address,
      status: "WORKING",
      currentCompany: partner1.name,
      currentPosition: "Junior Mechanic",
      university: null,
      businessName: null,
      deletedAt: null,
    },
    create: {
      id: "seed-alumni-1",
      studentId: student1.id,
      nis: student1.nis,
      name: student1.name,
      graduationYear: 2025,
      phone: student1.phone,
      email: student1.email,
      address: student1.address,
      status: "WORKING",
      currentCompany: partner1.name,
      currentPosition: "Junior Mechanic",
    },
  });

  const alumni2 = await prisma.alumni.upsert({
    where: { id: "seed-alumni-2" },
    update: {
      studentId: null,
      nis: "20240099",
      name: "Raka Pradipta",
      graduationYear: 2024,
      phone: "081299900111",
      email: "raka.pradipta@example.com",
      address: "Jl. Veteran No. 4",
      status: "STUDYING",
      currentCompany: null,
      currentPosition: null,
      university: "Politeknik Negeri Bandung",
      businessName: null,
      deletedAt: null,
    },
    create: {
      id: "seed-alumni-2",
      nis: "20240099",
      name: "Raka Pradipta",
      graduationYear: 2024,
      phone: "081299900111",
      email: "raka.pradipta@example.com",
      address: "Jl. Veteran No. 4",
      status: "STUDYING",
      university: "Politeknik Negeri Bandung",
    },
  });

  const job1 = await prisma.jobVacancy.upsert({
    where: { id: "seed-job-vacancy-1" },
    update: {
      industryPartnerId: partner1.id,
      title: "Teknisi Junior Otomotif",
      companyName: partner1.name,
      description: "Membantu perawatan kendaraan ringan dan servis berkala.",
      qualification: "Lulusan SMK otomotif, teliti, siap shift",
      location: "Jakarta Timur",
      employmentType: "Full Time",
      salaryRange: "Rp3.500.000 - Rp4.500.000",
      deadline: new Date("2026-08-31"),
      status: "DRAFT",
      publishedAt: null,
      deletedAt: null,
    },
    create: {
      id: "seed-job-vacancy-1",
      industryPartnerId: partner1.id,
      title: "Teknisi Junior Otomotif",
      companyName: partner1.name,
      description: "Membantu perawatan kendaraan ringan dan servis berkala.",
      qualification: "Lulusan SMK otomotif, teliti, siap shift",
      location: "Jakarta Timur",
      employmentType: "Full Time",
      salaryRange: "Rp3.500.000 - Rp4.500.000",
      deadline: new Date("2026-08-31"),
      status: "DRAFT",
    },
  });

  const job2 = await prisma.jobVacancy.upsert({
    where: { id: "seed-job-vacancy-2" },
    update: {
      industryPartnerId: partner2.id,
      title: "Staff Administrasi Digital",
      companyName: partner2.name,
      description: "Mengelola data operasional dan dokumentasi digital perusahaan.",
      qualification: "Terbiasa spreadsheet, komunikasi baik",
      location: "Bandung",
      employmentType: "Contract",
      salaryRange: "Rp3.000.000 - Rp4.000.000",
      deadline: new Date("2026-09-30"),
      status: "PUBLISHED",
      publishedAt: new Date("2026-06-15"),
      deletedAt: null,
    },
    create: {
      id: "seed-job-vacancy-2",
      industryPartnerId: partner2.id,
      title: "Staff Administrasi Digital",
      companyName: partner2.name,
      description: "Mengelola data operasional dan dokumentasi digital perusahaan.",
      qualification: "Terbiasa spreadsheet, komunikasi baik",
      location: "Bandung",
      employmentType: "Contract",
      salaryRange: "Rp3.000.000 - Rp4.000.000",
      deadline: new Date("2026-09-30"),
      status: "PUBLISHED",
      publishedAt: new Date("2026-06-15"),
    },
  });

  await prisma.jobApplication.upsert({
    where: { id: "seed-job-application-1" },
    update: {
      jobVacancyId: job2.id,
      alumniId: alumni1.id,
      applicantName: alumni1.name,
      applicantEmail: alumni1.email,
      applicantPhone: alumni1.phone,
      cvUrl: "/uploads/cv/andi.pdf",
      status: "REVIEWED",
      note: "Profil sesuai kebutuhan",
    },
    create: {
      id: "seed-job-application-1",
      jobVacancyId: job2.id,
      alumniId: alumni1.id,
      applicantName: alumni1.name,
      applicantEmail: alumni1.email,
      applicantPhone: alumni1.phone,
      cvUrl: "/uploads/cv/andi.pdf",
      status: "REVIEWED",
      note: "Profil sesuai kebutuhan",
    },
  });

  await prisma.jobApplication.upsert({
    where: { id: "seed-job-application-2" },
    update: {
      jobVacancyId: job2.id,
      alumniId: alumni2.id,
      applicantName: alumni2.name,
      applicantEmail: alumni2.email,
      applicantPhone: alumni2.phone,
      cvUrl: "/uploads/cv/raka.pdf",
      status: "SUBMITTED",
      note: null,
    },
    create: {
      id: "seed-job-application-2",
      jobVacancyId: job2.id,
      alumniId: alumni2.id,
      applicantName: alumni2.name,
      applicantEmail: alumni2.email,
      applicantPhone: alumni2.phone,
      cvUrl: "/uploads/cv/raka.pdf",
      status: "SUBMITTED",
    },
  });

  await prisma.tracerStudy.upsert({
    where: { id: "seed-tracer-study-1" },
    update: {
      alumniId: alumni1.id,
      year: 2026,
      status: "WORKING",
      companyName: partner1.name,
      position: "Junior Mechanic",
      university: null,
      major: null,
      businessName: null,
      incomeRange: "Rp3.000.000 - Rp5.000.000",
      feedback: "Kompetensi praktik sangat membantu pekerjaan",
    },
    create: {
      id: "seed-tracer-study-1",
      alumniId: alumni1.id,
      year: 2026,
      status: "WORKING",
      companyName: partner1.name,
      position: "Junior Mechanic",
      incomeRange: "Rp3.000.000 - Rp5.000.000",
      feedback: "Kompetensi praktik sangat membantu pekerjaan",
    },
  });

  await prisma.tracerStudy.upsert({
    where: { id: "seed-tracer-study-2" },
    update: {
      alumniId: alumni2.id,
      year: 2026,
      status: "STUDYING",
      companyName: null,
      position: null,
      university: "Politeknik Negeri Bandung",
      major: "Teknik Informatika",
      businessName: null,
      incomeRange: null,
      feedback: "Perlu lebih banyak materi persiapan karier",
    },
    create: {
      id: "seed-tracer-study-2",
      alumniId: alumni2.id,
      year: 2026,
      status: "STUDYING",
      university: "Politeknik Negeri Bandung",
      major: "Teknik Informatika",
      feedback: "Perlu lebih banyak materi persiapan karier",
    },
  });

  console.log("Phase 9 PKL, Alumni, and BKK data seeded.");
}

async function seedPhase10CommunicationReports() {
  const superAdmin = await prisma.user.findFirst({
    where: { email: process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@nexsmsid.dev", deletedAt: null },
  });

  if (!superAdmin) {
    console.log("Phase 10 seed: missing super admin user, skipping sample data.");
    return;
  }

  await prisma.announcement.upsert({
    where: { id: "seed-announcement-1" },
    update: {
      title: "Jadwal Ujian Akhir Semester",
      content: "Ujian akhir semester dimulai Senin, 15 Juni 2026. Peserta didik wajib hadir 30 menit lebih awal.",
      audience: "STUDENTS",
      status: "PUBLISHED",
      publishedAt: new Date("2026-06-01"),
      archivedAt: null,
      createdById: superAdmin.id,
      deletedAt: null,
    },
    create: {
      id: "seed-announcement-1",
      title: "Jadwal Ujian Akhir Semester",
      content: "Ujian akhir semester dimulai Senin, 15 Juni 2026. Peserta didik wajib hadir 30 menit lebih awal.",
      audience: "STUDENTS",
      status: "PUBLISHED",
      publishedAt: new Date("2026-06-01"),
      createdById: superAdmin.id,
    },
  });

  await prisma.announcement.upsert({
    where: { id: "seed-announcement-2" },
    update: {
      title: "Rapat Koordinasi Orang Tua",
      content: "Rapat koordinasi orang tua/wali kelas X dilaksanakan Jumat, 19 Juni 2026 pukul 09.00 WIB.",
      audience: "PARENTS",
      status: "DRAFT",
      publishedAt: null,
      archivedAt: null,
      createdById: superAdmin.id,
      deletedAt: null,
    },
    create: {
      id: "seed-announcement-2",
      title: "Rapat Koordinasi Orang Tua",
      content: "Rapat koordinasi orang tua/wali kelas X dilaksanakan Jumat, 19 Juni 2026 pukul 09.00 WIB.",
      audience: "PARENTS",
      status: "DRAFT",
      createdById: superAdmin.id,
    },
  });

  await prisma.internalMessage.upsert({
    where: { id: "seed-message-1" },
    update: {
      senderId: superAdmin.id,
      recipientId: superAdmin.id,
      subject: "Koordinasi publikasi pengumuman",
      body: "Mohon cek kembali konten pengumuman sebelum dipublikasikan ke portal publik.",
      status: "SENT",
      readAt: null,
      readById: null,
      deletedAt: null,
    },
    create: {
      id: "seed-message-1",
      senderId: superAdmin.id,
      recipientId: superAdmin.id,
      subject: "Koordinasi publikasi pengumuman",
      body: "Mohon cek kembali konten pengumuman sebelum dipublikasikan ke portal publik.",
      status: "SENT",
    },
  });

  await prisma.internalMessage.upsert({
    where: { id: "seed-message-2" },
    update: {
      senderId: superAdmin.id,
      recipientId: superAdmin.id,
      subject: "Laporan bulanan siap diekspor",
      body: "Laporan rekap keuangan dan PPDB bulan ini sudah siap untuk dicek.",
      status: "READ",
      readAt: new Date("2026-06-05"),
      readById: superAdmin.id,
      deletedAt: null,
    },
    create: {
      id: "seed-message-2",
      senderId: superAdmin.id,
      recipientId: superAdmin.id,
      subject: "Laporan bulanan siap diekspor",
      body: "Laporan rekap keuangan dan PPDB bulan ini sudah siap untuk dicek.",
      status: "READ",
      readAt: new Date("2026-06-05"),
      readById: superAdmin.id,
    },
  });

  await prisma.notification.upsert({
    where: { id: "seed-notification-1" },
    update: {
      userId: superAdmin.id,
      title: "Pengumuman baru terbit",
      body: "Jadwal ujian akhir semester sudah dipublikasikan.",
      channel: "IN_APP",
      status: "UNREAD",
      readAt: null,
      metadata: { module: "announcements" },
    },
    create: {
      id: "seed-notification-1",
      userId: superAdmin.id,
      title: "Pengumuman baru terbit",
      body: "Jadwal ujian akhir semester sudah dipublikasikan.",
      channel: "IN_APP",
      status: "UNREAD",
      metadata: { module: "announcements" },
    },
  });

  await prisma.notification.upsert({
    where: { id: "seed-notification-2" },
    update: {
      userId: superAdmin.id,
      title: "Laporan selesai",
      body: "Export laporan siswa berhasil dibuat.",
      channel: "IN_APP",
      status: "READ",
      readAt: new Date("2026-06-04"),
      metadata: { module: "reports" },
    },
    create: {
      id: "seed-notification-2",
      userId: superAdmin.id,
      title: "Laporan selesai",
      body: "Export laporan siswa berhasil dibuat.",
      channel: "IN_APP",
      status: "READ",
      readAt: new Date("2026-06-04"),
      metadata: { module: "reports" },
    },
  });

  await prisma.notification.upsert({
    where: { id: "seed-notification-3" },
    update: {
      userId: superAdmin.id,
      title: "Template pesan aktif",
      body: "Template notifikasi pembayaran sudah aktif.",
      channel: "EMAIL",
      status: "UNREAD",
      readAt: null,
      metadata: { module: "templates" },
    },
    create: {
      id: "seed-notification-3",
      userId: superAdmin.id,
      title: "Template pesan aktif",
      body: "Template notifikasi pembayaran sudah aktif.",
      channel: "EMAIL",
      status: "UNREAD",
      metadata: { module: "templates" },
    },
  });

  await prisma.notificationTemplate.upsert({
    where: { code: "ANNOUNCEMENT_PUBLISHED" },
    update: {
      name: "Pengumuman Dipublikasikan",
      channel: "IN_APP",
      subject: "Pengumuman baru",
      body: "Pengumuman {{title}} telah dipublikasikan.",
      isActive: true,
      createdById: superAdmin.id,
      deletedAt: null,
    },
    create: {
      id: "seed-template-1",
      code: "ANNOUNCEMENT_PUBLISHED",
      name: "Pengumuman Dipublikasikan",
      channel: "IN_APP",
      subject: "Pengumuman baru",
      body: "Pengumuman {{title}} telah dipublikasikan.",
      isActive: true,
      createdById: superAdmin.id,
    },
  });

  await prisma.notificationTemplate.upsert({
    where: { code: "REPORT_COMPLETED" },
    update: {
      name: "Laporan Selesai",
      channel: "EMAIL",
      subject: "Laporan {{title}} selesai",
      body: "Laporan yang Anda minta sudah selesai diproses.",
      isActive: true,
      createdById: superAdmin.id,
      deletedAt: null,
    },
    create: {
      id: "seed-template-2",
      code: "REPORT_COMPLETED",
      name: "Laporan Selesai",
      channel: "EMAIL",
      subject: "Laporan {{title}} selesai",
      body: "Laporan yang Anda minta sudah selesai diproses.",
      isActive: true,
      createdById: superAdmin.id,
    },
  });

  const reportJob1 = await prisma.reportJob.upsert({
    where: { id: "seed-report-job-1" },
    update: {
      type: "STUDENTS",
      title: "Rekap Data Siswa",
      format: "CSV",
      status: "COMPLETED",
      parameters: { status: "ACTIVE" },
      resultUrl: "/exports/students-seed-report-job-1.csv",
      errorMessage: null,
      requestedById: superAdmin.id,
      queuedAt: new Date("2026-06-03"),
      startedAt: new Date("2026-06-03T01:00:00Z"),
      completedAt: new Date("2026-06-03T01:01:00Z"),
    },
    create: {
      id: "seed-report-job-1",
      type: "STUDENTS",
      title: "Rekap Data Siswa",
      format: "CSV",
      status: "COMPLETED",
      parameters: { status: "ACTIVE" },
      resultUrl: "/exports/students-seed-report-job-1.csv",
      requestedById: superAdmin.id,
      queuedAt: new Date("2026-06-03"),
      startedAt: new Date("2026-06-03T01:00:00Z"),
      completedAt: new Date("2026-06-03T01:01:00Z"),
    },
  });

  const reportJob2 = await prisma.reportJob.upsert({
    where: { id: "seed-report-job-2" },
    update: {
      type: "FINANCE",
      title: "Rekap Keuangan Juni",
      format: "XLSX",
      status: "PENDING",
      parameters: { month: "2026-06" },
      resultUrl: null,
      errorMessage: null,
      requestedById: superAdmin.id,
      queuedAt: new Date("2026-06-04"),
      startedAt: null,
      completedAt: null,
    },
    create: {
      id: "seed-report-job-2",
      type: "FINANCE",
      title: "Rekap Keuangan Juni",
      format: "XLSX",
      status: "PENDING",
      parameters: { month: "2026-06" },
      requestedById: superAdmin.id,
      queuedAt: new Date("2026-06-04"),
    },
  });

  await prisma.exportHistory.upsert({
    where: { id: "seed-export-history-1" },
    update: {
      reportJobId: reportJob1.id,
      entity: "STUDENTS",
      format: "CSV",
      fileName: "students-seed-report-job-1.csv",
      fileUrl: "/exports/students-seed-report-job-1.csv",
      rowCount: 2,
      requestedById: superAdmin.id,
    },
    create: {
      id: "seed-export-history-1",
      reportJobId: reportJob1.id,
      entity: "STUDENTS",
      format: "CSV",
      fileName: "students-seed-report-job-1.csv",
      fileUrl: "/exports/students-seed-report-job-1.csv",
      rowCount: 2,
      requestedById: superAdmin.id,
    },
  });

  await prisma.exportHistory.upsert({
    where: { id: "seed-export-history-2" },
    update: {
      reportJobId: reportJob2.id,
      entity: "FINANCE",
      format: "XLSX",
      fileName: "finance-june-preview.xlsx",
      fileUrl: "/exports/finance-june-preview.xlsx",
      rowCount: 2,
      requestedById: superAdmin.id,
    },
    create: {
      id: "seed-export-history-2",
      reportJobId: reportJob2.id,
      entity: "FINANCE",
      format: "XLSX",
      fileName: "finance-june-preview.xlsx",
      fileUrl: "/exports/finance-june-preview.xlsx",
      rowCount: 2,
      requestedById: superAdmin.id,
    },
  });

  // Phase 12.0B Demo Users (Staging Only)
  const konselorRole = await prisma.role.findUniqueOrThrow({ where: { slug: "konselor-bk" } });
  const tataTertibRole = await prisma.role.findUniqueOrThrow({ where: { slug: "petugas-tata-tertib" } });
  const sarprasRole = await prisma.role.findUniqueOrThrow({ where: { slug: "petugas-sarpras" } });
  const perpustakaanRole = await prisma.role.findUniqueOrThrow({ where: { slug: "petugas-perpustakaan" } });
  const suratRole = await prisma.role.findUniqueOrThrow({ where: { slug: "petugas-surat" } });
  const approverRole = await prisma.role.findUniqueOrThrow({ where: { slug: "approver" } });

  const createDemoUser = async (email: string, name: string, roleId: string) => {
    const defaultPasswordHash = await bcrypt.hash("ChangeMe123!", 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash: defaultPasswordHash, status: "ACTIVE", forceChangePassword: true, deletedAt: null },
      create: { email, name, passwordHash: defaultPasswordHash, status: "ACTIVE", forceChangePassword: true },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
  };

  await createDemoUser("konselor@nexsmsid.dev", "Demo Konselor BK", konselorRole.id);
  await createDemoUser("tatatertib@nexsmsid.dev", "Demo Tata Tertib", tataTertibRole.id);
  await createDemoUser("sarpras@nexsmsid.dev", "Demo Sarpras", sarprasRole.id);
  await createDemoUser("perpustakaan@nexsmsid.dev", "Demo Perpustakaan", perpustakaanRole.id);
  await createDemoUser("surat@nexsmsid.dev", "Demo Petugas Surat", suratRole.id);
  await createDemoUser("approver@nexsmsid.dev", "Demo Approver", approverRole.id);

  console.log("Phase 10 communication, notification, and report data seeded.");
  console.log("Phase 12.0B permission foundation and demo users seeded.");
}

async function seedPhase121BkDiscipline() {
  const [superAdmin, konselor, tataTertib] = await Promise.all([
    prisma.user.findFirst({ where: { email: process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@nexsmsid.dev", deletedAt: null } }),
    prisma.user.findFirst({ where: { email: "konselor@nexsmsid.dev", deletedAt: null } }),
    prisma.user.findFirst({ where: { email: "tatatertib@nexsmsid.dev", deletedAt: null } }),
  ]);
  const student = await prisma.student.findFirst({ where: { deletedAt: null, status: "ACTIVE" as any }, orderBy: { name: "asc" } });

  if (!superAdmin || !student) {
    console.log("Phase 12.1 BK/Discipline seed: missing prerequisite user/student data, skipping.");
    return;
  }

  const actorId = tataTertib?.id ?? konselor?.id ?? superAdmin.id;
  const counselorId = konselor?.id ?? superAdmin.id;

  const terlambat = await prisma.disciplineRule.upsert({
    where: { code: "TERLAMBAT" },
    update: { name: "Terlambat", description: "Datang melewati jam masuk sekolah.", point: 5, severity: "LOW", isActive: true },
    create: {
      id: "seed-discipline-rule-terlambat",
      code: "TERLAMBAT",
      name: "Terlambat",
      description: "Datang melewati jam masuk sekolah.",
      point: 5,
      severity: "LOW",
      isActive: true,
    },
  });
  const atribut = await prisma.disciplineRule.upsert({
    where: { code: "ATRIBUT" },
    update: {
      name: "Tidak Memakai Atribut",
      description: "Seragam atau atribut sekolah tidak lengkap.",
      point: 10,
      severity: "MEDIUM",
      isActive: true,
    },
    create: {
      id: "seed-discipline-rule-atribut",
      code: "ATRIBUT",
      name: "Tidak Memakai Atribut",
      description: "Seragam atau atribut sekolah tidak lengkap.",
      point: 10,
      severity: "MEDIUM",
      isActive: true,
    },
  });
  await prisma.disciplineRule.upsert({
    where: { code: "BOLOS" },
    update: {
      name: "Bolos",
      description: "Tidak mengikuti kegiatan pembelajaran tanpa keterangan.",
      point: 25,
      severity: "HIGH",
      isActive: true,
    },
    create: {
      id: "seed-discipline-rule-bolos",
      code: "BOLOS",
      name: "Bolos",
      description: "Tidak mengikuti kegiatan pembelajaran tanpa keterangan.",
      point: 25,
      severity: "HIGH",
      isActive: true,
    },
  });

  await prisma.disciplineViolation.upsert({
    where: { id: "seed-discipline-violation-draft" },
    update: {
      studentId: student.id,
      ruleId: atribut.id,
      reportedById: actorId,
      incidentDate: new Date("2026-06-03"),
      description: "Atribut seragam belum lengkap saat apel pagi.",
      point: atribut.point,
      status: "DRAFT",
      confirmedById: null,
      confirmedAt: null,
      cancelledAt: null,
      deletedAt: null,
    },
    create: {
      id: "seed-discipline-violation-draft",
      studentId: student.id,
      ruleId: atribut.id,
      reportedById: actorId,
      incidentDate: new Date("2026-06-03"),
      description: "Atribut seragam belum lengkap saat apel pagi.",
      point: atribut.point,
      status: "DRAFT",
    },
  });

  await prisma.disciplineViolation.upsert({
    where: { id: "seed-discipline-violation-confirmed" },
    update: {
      studentId: student.id,
      ruleId: terlambat.id,
      reportedById: actorId,
      incidentDate: new Date("2026-06-02"),
      description: "Terlambat masuk kelas pertama.",
      point: terlambat.point,
      status: "CONFIRMED",
      confirmedById: actorId,
      confirmedAt: new Date("2026-06-02T01:00:00Z"),
      cancelledAt: null,
      deletedAt: null,
    },
    create: {
      id: "seed-discipline-violation-confirmed",
      studentId: student.id,
      ruleId: terlambat.id,
      reportedById: actorId,
      incidentDate: new Date("2026-06-02"),
      description: "Terlambat masuk kelas pertama.",
      point: terlambat.point,
      status: "CONFIRMED",
      confirmedById: actorId,
      confirmedAt: new Date("2026-06-02T01:00:00Z"),
    },
  });

  await prisma.studentAchievement.upsert({
    where: { id: "seed-student-achievement-1" },
    update: {
      studentId: student.id,
      title: "Juara Lomba Kebersihan Kelas",
      category: "Kedisiplinan",
      point: 15,
      awardedAt: new Date("2026-06-04"),
      description: "Aktif menjaga kebersihan kelas.",
      awardedById: actorId,
      deletedAt: null,
    },
    create: {
      id: "seed-student-achievement-1",
      studentId: student.id,
      title: "Juara Lomba Kebersihan Kelas",
      category: "Kedisiplinan",
      point: 15,
      awardedAt: new Date("2026-06-04"),
      description: "Aktif menjaga kebersihan kelas.",
      awardedById: actorId,
    },
  });

  const counselingCase = await prisma.counselingCase.upsert({
    where: { id: "seed-counseling-case-1" },
    update: {
      studentId: student.id,
      counselorId,
      title: "Pendampingan Adaptasi Belajar",
      category: "Akademik",
      priority: "MEDIUM",
      status: "OPEN",
      description: "Siswa membutuhkan pendampingan adaptasi jadwal belajar.",
      resolution: null,
      followUpDate: new Date("2026-06-10"),
      createdById: counselorId,
      updatedById: null,
      closedAt: null,
      deletedAt: null,
    },
    create: {
      id: "seed-counseling-case-1",
      studentId: student.id,
      counselorId,
      title: "Pendampingan Adaptasi Belajar",
      category: "Akademik",
      priority: "MEDIUM",
      status: "OPEN",
      description: "Siswa membutuhkan pendampingan adaptasi jadwal belajar.",
      followUpDate: new Date("2026-06-10"),
      createdById: counselorId,
    },
  });

  await prisma.counselingNote.upsert({
    where: { id: "seed-counseling-note-private-1" },
    update: {
      caseId: counselingCase.id,
      note: "Catatan privat BK untuk tindak lanjut internal.",
      visibility: "PRIVATE",
      createdById: counselorId,
    },
    create: {
      id: "seed-counseling-note-private-1",
      caseId: counselingCase.id,
      note: "Catatan privat BK untuk tindak lanjut internal.",
      visibility: "PRIVATE",
      createdById: counselorId,
    },
  });

  console.log("Phase 12.1 BK and discipline sample data seeded.");
}

async function seedPhase122LetterManagement() {
  const [superAdmin, petugasSurat, approver] = await Promise.all([
    prisma.user.findFirst({ where: { email: process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@nexsmsid.dev", deletedAt: null } }),
    prisma.user.findFirst({ where: { email: "surat@nexsmsid.dev", deletedAt: null } }),
    prisma.user.findFirst({ where: { email: "approver@nexsmsid.dev", deletedAt: null } }),
  ]);
  const [student, guardian, teacher, staff] = await Promise.all([
    prisma.student.findFirst({ where: { deletedAt: null, status: "ACTIVE" as any }, orderBy: { name: "asc" } }),
    prisma.guardian.findFirst({ orderBy: { name: "asc" } }),
    prisma.teacher.findFirst({ where: { deletedAt: null, status: "ACTIVE" as any }, orderBy: { name: "asc" } }),
    prisma.staff.findFirst({ where: { deletedAt: null, status: "ACTIVE" as any }, orderBy: { name: "asc" } }),
  ]);

  if (!superAdmin || !student || !guardian || !teacher || !staff) {
    console.log("Phase 12.2 letter management seed: missing prerequisite data, skipping.");
    return;
  }

  const actorId = petugasSurat?.id ?? superAdmin.id;
  const approverId = approver?.id ?? superAdmin.id;

  await seedLetterSequences();

  const templates = [
    {
      id: "seed-letter-template-skl",
      code: "SKL",
      name: "Surat Keterangan Siswa",
      category: "SKL",
      requiresApproval: false,
      subjectTemplate: "Surat Keterangan Siswa {{studentName}}",
      bodyTemplate: "Dengan ini menerangkan bahwa {{studentName}} adalah siswa aktif NexSMSID School.",
      variables: ["studentName", "nis", "classroom"],
    },
    {
      id: "seed-letter-template-spo",
      code: "SPO",
      name: "Surat Panggilan Orang Tua",
      category: "SPO",
      requiresApproval: true,
      subjectTemplate: "Panggilan Orang Tua/Wali {{studentName}}",
      bodyTemplate: "Orang tua/wali siswa {{studentName}} diundang hadir ke sekolah untuk koordinasi pembinaan.",
      variables: ["studentName", "guardianName", "agenda"],
    },
    {
      id: "seed-letter-template-stg",
      code: "STG",
      name: "Surat Tugas Guru",
      category: "STG",
      requiresApproval: true,
      subjectTemplate: "Surat Tugas {{teacherName}}",
      bodyTemplate: "Menugaskan {{teacherName}} untuk melaksanakan kegiatan sekolah sesuai jadwal yang ditentukan.",
      variables: ["teacherName", "activity", "date"],
    },
    {
      id: "seed-letter-template-und",
      code: "UND",
      name: "Undangan Rapat",
      category: "UND",
      requiresApproval: false,
      subjectTemplate: "Undangan Rapat {{agenda}}",
      bodyTemplate: "Dengan hormat, kami mengundang Bapak/Ibu untuk menghadiri rapat {{agenda}}.",
      variables: ["agenda", "date", "place"],
    },
  ];

  for (const template of templates) {
    await prisma.letterTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        category: template.category,
        status: "ACTIVE",
        subjectTemplate: template.subjectTemplate,
        bodyTemplate: template.bodyTemplate,
        variables: template.variables,
        requiresApproval: template.requiresApproval,
        createdById: actorId,
        updatedById: actorId,
        deletedAt: null,
      },
      create: {
        id: template.id,
        code: template.code,
        name: template.name,
        category: template.category,
        status: "ACTIVE",
        subjectTemplate: template.subjectTemplate,
        bodyTemplate: template.bodyTemplate,
        variables: template.variables,
        requiresApproval: template.requiresApproval,
        createdById: actorId,
      },
    });
  }

  await prisma.letter.upsert({
    where: { id: "seed-letter-draft" },
    update: {
      templateId: "seed-letter-template-skl",
      letterNumber: null,
      subject: "Draft Surat Keterangan Siswa",
      body: `Draft keterangan bahwa ${student.name} adalah siswa aktif sekolah.`,
      direction: "OUTGOING",
      status: "DRAFT",
      priority: "NORMAL",
      category: "SKL",
      recipientType: "STUDENT",
      recipientName: student.name,
      recipientEmail: student.email,
      recipientAddress: student.address,
      studentId: student.id,
      guardianId: null,
      teacherId: null,
      staffId: null,
      createdById: actorId,
      updatedById: actorId,
      approvedById: null,
      rejectedById: null,
      rejectionReason: null,
      issuedAt: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      archivedAt: null,
      cancelledAt: null,
      deletedAt: null,
    },
    create: {
      id: "seed-letter-draft",
      templateId: "seed-letter-template-skl",
      subject: "Draft Surat Keterangan Siswa",
      body: `Draft keterangan bahwa ${student.name} adalah siswa aktif sekolah.`,
      direction: "OUTGOING",
      status: "DRAFT",
      priority: "NORMAL",
      category: "SKL",
      recipientType: "STUDENT",
      recipientName: student.name,
      recipientEmail: student.email,
      recipientAddress: student.address,
      studentId: student.id,
      createdById: actorId,
    },
  });

  await prisma.letter.upsert({
    where: { id: "seed-letter-submitted" },
    update: {
      templateId: "seed-letter-template-spo",
      letterNumber: null,
      subject: "Panggilan Orang Tua - Pembinaan Siswa",
      body: `Orang tua/wali ${student.name} diundang hadir untuk koordinasi pembinaan siswa.`,
      direction: "OUTGOING",
      status: "SUBMITTED",
      priority: "HIGH",
      category: "SPO",
      recipientType: "GUARDIAN",
      recipientName: guardian.name,
      recipientEmail: guardian.email,
      recipientAddress: guardian.address,
      studentId: student.id,
      guardianId: guardian.id,
      teacherId: null,
      staffId: null,
      createdById: actorId,
      updatedById: actorId,
      approvedById: null,
      rejectedById: null,
      rejectionReason: null,
      submittedAt: new Date("2026-06-04T02:00:00Z"),
      approvedAt: null,
      rejectedAt: null,
      issuedAt: null,
      archivedAt: null,
      cancelledAt: null,
      deletedAt: null,
    },
    create: {
      id: "seed-letter-submitted",
      templateId: "seed-letter-template-spo",
      subject: "Panggilan Orang Tua - Pembinaan Siswa",
      body: `Orang tua/wali ${student.name} diundang hadir untuk koordinasi pembinaan siswa.`,
      direction: "OUTGOING",
      status: "SUBMITTED",
      priority: "HIGH",
      category: "SPO",
      recipientType: "GUARDIAN",
      recipientName: guardian.name,
      recipientEmail: guardian.email,
      recipientAddress: guardian.address,
      studentId: student.id,
      guardianId: guardian.id,
      submittedAt: new Date("2026-06-04T02:00:00Z"),
      createdById: actorId,
    },
  });

  await prisma.letterApproval.upsert({
    where: { id: "seed-letter-approval-submitted" },
    update: { letterId: "seed-letter-submitted", approverId, status: "PENDING", note: null, approvedAt: null, rejectedAt: null },
    create: { id: "seed-letter-approval-submitted", letterId: "seed-letter-submitted", approverId, status: "PENDING" },
  });

  await prisma.letter.upsert({
    where: { id: "seed-letter-approved" },
    update: {
      templateId: "seed-letter-template-stg",
      letterNumber: null,
      subject: "Surat Tugas Guru Pendamping",
      body: `Menugaskan ${teacher.name} untuk mendampingi kegiatan sekolah.`,
      direction: "OUTGOING",
      status: "APPROVED",
      priority: "NORMAL",
      category: "STG",
      recipientType: "TEACHER",
      recipientName: teacher.name,
      recipientEmail: teacher.email,
      recipientAddress: teacher.address,
      studentId: null,
      guardianId: null,
      teacherId: teacher.id,
      staffId: null,
      createdById: actorId,
      updatedById: actorId,
      approvedById: approverId,
      rejectedById: null,
      rejectionReason: null,
      submittedAt: new Date("2026-06-04T03:00:00Z"),
      approvedAt: new Date("2026-06-04T04:00:00Z"),
      rejectedAt: null,
      issuedAt: null,
      archivedAt: null,
      cancelledAt: null,
      deletedAt: null,
    },
    create: {
      id: "seed-letter-approved",
      templateId: "seed-letter-template-stg",
      subject: "Surat Tugas Guru Pendamping",
      body: `Menugaskan ${teacher.name} untuk mendampingi kegiatan sekolah.`,
      direction: "OUTGOING",
      status: "APPROVED",
      priority: "NORMAL",
      category: "STG",
      recipientType: "TEACHER",
      recipientName: teacher.name,
      recipientEmail: teacher.email,
      recipientAddress: teacher.address,
      teacherId: teacher.id,
      submittedAt: new Date("2026-06-04T03:00:00Z"),
      approvedAt: new Date("2026-06-04T04:00:00Z"),
      approvedById: approverId,
      createdById: actorId,
    },
  });

  await prisma.letterApproval.upsert({
    where: { id: "seed-letter-approval-approved" },
    update: {
      letterId: "seed-letter-approved",
      approverId,
      status: "APPROVED",
      note: "Disetujui untuk diterbitkan.",
      approvedAt: new Date("2026-06-04T04:00:00Z"),
      rejectedAt: null,
    },
    create: {
      id: "seed-letter-approval-approved",
      letterId: "seed-letter-approved",
      approverId,
      status: "APPROVED",
      note: "Disetujui untuk diterbitkan.",
      approvedAt: new Date("2026-06-04T04:00:00Z"),
    },
  });

  await prisma.letter.upsert({
    where: { id: "seed-letter-issued" },
    update: {
      templateId: "seed-letter-template-skl",
      letterNumber: "001/SKL/NEXSMSID/VI/2026",
      subject: "Surat Keterangan Siswa Aktif",
      body: `Dengan ini menerangkan bahwa ${student.name} adalah siswa aktif NexSMSID School.`,
      direction: "OUTGOING",
      status: "ISSUED",
      priority: "NORMAL",
      category: "SKL",
      recipientType: "STAFF",
      recipientName: staff.name,
      recipientEmail: staff.email,
      recipientAddress: staff.address,
      studentId: student.id,
      guardianId: null,
      teacherId: null,
      staffId: staff.id,
      createdById: actorId,
      updatedById: actorId,
      approvedById: approverId,
      rejectedById: null,
      rejectionReason: null,
      submittedAt: new Date("2026-06-05T01:00:00Z"),
      approvedAt: new Date("2026-06-05T02:00:00Z"),
      issuedAt: new Date("2026-06-05T03:00:00Z"),
      rejectedAt: null,
      archivedAt: null,
      cancelledAt: null,
      deletedAt: null,
    },
    create: {
      id: "seed-letter-issued",
      templateId: "seed-letter-template-skl",
      letterNumber: "001/SKL/NEXSMSID/VI/2026",
      subject: "Surat Keterangan Siswa Aktif",
      body: `Dengan ini menerangkan bahwa ${student.name} adalah siswa aktif NexSMSID School.`,
      direction: "OUTGOING",
      status: "ISSUED",
      priority: "NORMAL",
      category: "SKL",
      recipientType: "STAFF",
      recipientName: staff.name,
      recipientEmail: staff.email,
      recipientAddress: staff.address,
      studentId: student.id,
      staffId: staff.id,
      submittedAt: new Date("2026-06-05T01:00:00Z"),
      approvedAt: new Date("2026-06-05T02:00:00Z"),
      issuedAt: new Date("2026-06-05T03:00:00Z"),
      approvedById: approverId,
      createdById: actorId,
    },
  });

  await ensureLetterSequence("SKL", 2026, 6, 1);
  console.log("Phase 12.2 letter management sample data seeded.");
}

async function seedLetterSequences() {
  const categories = ["SKL", "SPT", "SPO", "STG", "UND", "INT"];
  for (const category of categories) {
    await ensureLetterSequence(category, 2026, 6, 0);
  }
}

async function ensureLetterSequence(category: string, year: number, month: number, minimumCurrentNumber: number) {
  const existing = await prisma.letterNumberSequence.findUnique({ where: { category_year_month: { category, year, month } } });
  if (existing) {
    if (existing.currentNumber < minimumCurrentNumber) {
      await prisma.letterNumberSequence.update({
        where: { id: existing.id },
        data: { currentNumber: minimumCurrentNumber, format: "{number}/{category}/NEXSMSID/{romanMonth}/{year}" },
      });
    }
    return;
  }
  await prisma.letterNumberSequence.create({
    data: { category, year, month, currentNumber: minimumCurrentNumber, format: "{number}/{category}/NEXSMSID/{romanMonth}/{year}" },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function seedPhase123InventorySarpras(adminId: string) {
  let actorId = adminId;
  const petugasRole = await prisma.role.findUnique({ where: { slug: "petugas-sarpras" } });

  if (petugasRole) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
    const petugas = await prisma.user.upsert({
      where: { email: "sarpras@nexsmsid.dev" },
      update: { name: "Petugas Sarpras", passwordHash, status: "ACTIVE", forceChangePassword: true, deletedAt: null },
      create: {
        email: "sarpras@nexsmsid.dev",
        name: "Petugas Sarpras",
        passwordHash,
        status: "ACTIVE",
        forceChangePassword: true,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: petugas.id, roleId: petugasRole.id } },
      update: {},
      create: { userId: petugas.id, roleId: petugasRole.id },
    });
    actorId = petugas.id;
  }

  const catElektronik = await prisma.inventoryCategory.upsert({
    where: { code: "ELEKTRONIK" },
    update: {},
    create: { code: "ELEKTRONIK", name: "Elektronik", description: "Perangkat elektronik" },
  });

  const catFurniture = await prisma.inventoryCategory.upsert({
    where: { code: "FURNITURE" },
    update: {},
    create: { code: "FURNITURE", name: "Furniture", description: "Perabot kelas dan kantor" },
  });

  const catLab = await prisma.inventoryCategory.upsert({
    where: { code: "LAB" },
    update: {},
    create: { code: "LAB", name: "Alat Lab", description: "Peralatan laboratorium" },
  });

  const catAtk = await prisma.inventoryCategory.upsert({
    where: { code: "ATK" },
    update: {},
    create: { code: "ATK", name: "ATK", description: "Alat tulis kantor" },
  });

  const locGudang = await prisma.inventoryLocation.upsert({
    where: { code: "GUDANG" },
    update: {},
    create: { code: "GUDANG", name: "Gudang Utama" },
  });

  const locGuru = await prisma.inventoryLocation.upsert({
    where: { code: "RUANG-GURU" },
    update: {},
    create: { code: "RUANG-GURU", name: "Ruang Guru" },
  });

  const locLabKomputer = await prisma.inventoryLocation.upsert({
    where: { code: "LAB-KOMPUTER" },
    update: {},
    create: { code: "LAB-KOMPUTER", name: "Lab Komputer" },
  });

  const locPerpus = await prisma.inventoryLocation.upsert({
    where: { code: "PERPUSTAKAAN" },
    update: {},
    create: { code: "PERPUSTAKAAN", name: "Perpustakaan" },
  });

  const itemLaptop = await prisma.inventoryItem.upsert({
    where: { code: "INV-LP-001" },
    update: {},
    create: {
      code: "INV-LP-001",
      name: "Laptop Inventaris",
      categoryId: catElektronik.id,
      locationId: locGudang.id,
      type: "ASSET",
      quantity: 5,
      minStock: 1,
      status: "ACTIVE",
      condition: "GOOD",
      createdById: actorId,
    },
  });

  const itemProyektor = await prisma.inventoryItem.upsert({
    where: { code: "INV-PRJ-001" },
    update: {},
    create: {
      code: "INV-PRJ-001",
      name: "Proyektor",
      categoryId: catElektronik.id,
      locationId: locLabKomputer.id,
      type: "ASSET",
      quantity: 2,
      minStock: 1,
      status: "ACTIVE",
      condition: "GOOD",
      createdById: actorId,
    },
  });

  const itemMeja = await prisma.inventoryItem.upsert({
    where: { code: "INV-MJ-001" },
    update: {},
    create: {
      code: "INV-MJ-001",
      name: "Meja Siswa",
      categoryId: catFurniture.id,
      locationId: locGudang.id,
      type: "ASSET",
      quantity: 100,
      minStock: 10,
      status: "ACTIVE",
      condition: "GOOD",
      createdById: actorId,
    },
  });

  const itemKursi = await prisma.inventoryItem.upsert({
    where: { code: "INV-KR-001" },
    update: {},
    create: {
      code: "INV-KR-001",
      name: "Kursi Siswa",
      categoryId: catFurniture.id,
      locationId: locGudang.id,
      type: "ASSET",
      quantity: 100,
      minStock: 10,
      status: "ACTIVE",
      condition: "GOOD",
      createdById: actorId,
    },
  });

  const itemSpidol = await prisma.inventoryItem.upsert({
    where: { code: "INV-SPD-001" },
    update: {},
    create: {
      code: "INV-SPD-001",
      name: "Spidol Boardmarker",
      categoryId: catAtk.id,
      locationId: locGuru.id,
      type: "CONSUMABLE",
      quantity: 50,
      minStock: 20,
      status: "ACTIVE",
      condition: "NEW",
      createdById: actorId,
    },
  });

  const initialStockMovement = await prisma.inventoryMovement.findFirst({
    where: { itemId: itemLaptop.id, type: "IN" },
  });

  if (!initialStockMovement) {
    await prisma.inventoryMovement.create({
      data: {
        itemId: itemLaptop.id,
        type: "IN",
        quantity: 5,
        toLocationId: locGudang.id,
        note: "Initial stock",
        performedById: actorId,
      },
    });
  }

  const transferSample = await prisma.inventoryMovement.findFirst({
    where: { itemId: itemMeja.id, type: "TRANSFER" },
  });

  if (!transferSample) {
    await prisma.inventoryMovement.create({
      data: {
        itemId: itemMeja.id,
        type: "TRANSFER",
        quantity: 20,
        fromLocationId: locGudang.id,
        toLocationId: locGuru.id,
        note: "Transfer to ruang guru",
        performedById: actorId,
      },
    });
  }

  const maint = await prisma.inventoryMaintenance.findFirst({
    where: { itemId: itemProyektor.id },
  });

  if (!maint) {
    await prisma.inventoryMaintenance.create({
      data: {
        itemId: itemProyektor.id,
        title: "Pembersihan Lensa Proyektor",
        description: "Pembersihan rutin lensa proyektor",
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdById: actorId,
      },
    });
  }

  const teacherUser = await prisma.user.findUnique({ where: { email: "guru@nexsmsid.dev" } });

  if (teacherUser) {
    const reqLoan = await prisma.inventoryLoan.findFirst({
      where: { itemId: itemProyektor.id, borrowerUserId: teacherUser.id, status: "REQUESTED" },
    });
    if (!reqLoan) {
      await prisma.inventoryLoan.create({
        data: {
          itemId: itemProyektor.id,
          borrowerUserId: teacherUser.id,
          borrowerName: teacherUser.name,
          borrowerType: "TEACHER",
          quantity: 1,
          purpose: "Kegiatan belajar mengajar ekstra",
          status: "REQUESTED",
          createdById: teacherUser.id,
        },
      });
    }

    const borrowedLoan = await prisma.inventoryLoan.findFirst({
      where: { itemId: itemLaptop.id, borrowerUserId: teacherUser.id, status: "BORROWED" },
    });
    if (!borrowedLoan) {
      await prisma.inventoryLoan.create({
        data: {
          itemId: itemLaptop.id,
          borrowerUserId: teacherUser.id,
          borrowerName: teacherUser.name,
          borrowerType: "TEACHER",
          quantity: 1,
          purpose: "Dinas luar kota",
          status: "BORROWED",
          borrowedAt: new Date(),
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          approvedById: actorId,
          approvedAt: new Date(),
          createdById: teacherUser.id,
        },
      });
    }
  }

  console.log("Phase 12.3 inventory sarpras sample data seeded.");

  // =========================================================================
  // Phase 12.4 Library Management Seed
  // =========================================================================

  const libCat = await prisma.libraryCategory.upsert({
    where: { code: "FIK" },
    update: {},
    create: {
      name: "Fiksi",
      description: "Buku fiksi dan novel",
      code: "FIK",
    },
  });

  const libShelf = await prisma.libraryShelf.upsert({
    where: { code: "RAK-01" },
    update: {},
    create: {
      name: "Rak Utama 1",
      code: "RAK-01",
      location: "Lantai 1",
    },
  });

  const libBook = await prisma.libraryBook.upsert({
    where: { code: "BK-001" },
    update: {},
    create: {
      title: "Laskar Pelangi",
      code: "BK-001",
      author: "Andrea Hirata",
      publisher: "Bentang Pustaka",
      isbn: "978-979-3062-79-2",
      publicationYear: 2005,
      categoryId: libCat.id,
      shelfId: libShelf.id,
      description: "Novel Laskar Pelangi",
      createdById: actorId,
    },
  });

  const libCopy1 = await prisma.libraryBookCopy.upsert({
    where: { copyCode: "CP-001" },
    update: {},
    create: {
      bookId: libBook.id,
      copyCode: "CP-001",
      barcode: "BC-CP-001",
      condition: "GOOD",
      status: "AVAILABLE",
    },
  });

  const libCopy2 = await prisma.libraryBookCopy.upsert({
    where: { copyCode: "CP-002" },
    update: {},
    create: {
      bookId: libBook.id,
      copyCode: "CP-002",
      barcode: "BC-CP-002",
      condition: "GOOD",
      status: "AVAILABLE",
    },
  });

  if (teacherUser) {
    const libMember = await prisma.libraryMember.upsert({
      where: { memberCode: "MEM-001" },
      update: {},
      create: {
        userId: teacherUser.id,
        memberCode: "MEM-001",
        type: "TEACHER",
        status: "ACTIVE",
        joinedAt: new Date(),
        expiredAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Add loan, reservation, fine
    const loan = await prisma.libraryLoan.findFirst({ where: { copyId: libCopy1.id } });
    if (!loan) {
      await prisma.libraryLoan.create({
        data: {
          memberId: libMember.id,
          copyId: libCopy1.id,
          status: "BORROWED",
          borrowedAt: new Date(),
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          borrowedById: actorId,
        },
      });
      await prisma.libraryBookCopy.update({
        where: { id: libCopy1.id },
        data: { status: "BORROWED" },
      });
    }
  }

  console.log("Phase 12.4 library management sample data seeded.");
}

async function seedHRManagement(adminId: string) {
  await prisma.leaveRequest.deleteMany();
  await prisma.employeeAttendance.deleteMany();
  await prisma.employeeSalaryComponent.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.hRPosition.deleteMany();

  const positions = await Promise.all([
    prisma.hRPosition.create({
      data: { code: "GURU-01", name: "Guru Mata Pelajaran", description: "Guru pengampu mata pelajaran", isActive: true },
    }),
    prisma.hRPosition.create({
      data: { code: "WKUR-01", name: "Wakil Kepala Kurikulum", description: "Wakil kepala bidang kurikulum", isActive: true },
    }),
    prisma.hRPosition.create({
      data: { code: "WKSIS-01", name: "Wakil Kepala Kesiswaan", description: "Wakil kepala bidang kesiswaan", isActive: true },
    }),
    prisma.hRPosition.create({
      data: { code: "STU-01", name: "Staff Tata Usaha", description: "Staff administrasi tata usaha", isActive: true },
    }),
    prisma.hRPosition.create({ data: { code: "BENDA-01", name: "Bendahara", description: "Bendahara sekolah", isActive: true } }),
  ]);

  const teachers = await prisma.teacher.findMany({ take: 3 });
  for (let i = 0; i < Math.min(teachers.length, positions.length); i++) {
    await prisma.employeeProfile.create({
      data: {
        employeeCode: `EMP-${String(i + 1).padStart(3, "0")}`,
        userId: teachers[i].userId,
        positionId: positions[i].id,
        fullName: teachers[i].name,
        status: "ACTIVE",
        employmentType: "PERMANENT",
        joinedAt: new Date("2024-07-01"),
        createdById: adminId,
      },
    });
  }

  const allEmployees = await prisma.employeeProfile.findMany({ take: 3 });
  for (const emp of allEmployees) {
    await prisma.employeeAttendance.create({
      data: { employeeId: emp.id, date: new Date(), status: "PRESENT", recordedById: adminId },
    });
    await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        type: "ANNUAL",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        totalDays: 1,
        status: "APPROVED",
        reason: "Cuti tahunan",
        createdById: adminId,
      },
    });
  }
  console.log("HR management sample data seeded.");
}

async function seedPayroll(adminId?: string) {
  await prisma.payrollComponent.deleteMany();
  await prisma.payrollPeriod.deleteMany();
  await prisma.employeeSalaryComponent.deleteMany();

  await prisma.payrollComponent.createMany({
    data: [
      { code: "GAPOK", name: "Gaji Pokok", type: "EARNING", calculationType: "FIXED", isActive: true },
      { code: "TUNJANGAN", name: "Tunjangan Jabatan", type: "EARNING", calculationType: "FIXED", isActive: true },
      { code: "TRANSPORT", name: "Tunjangan Transport", type: "EARNING", calculationType: "FIXED", isActive: true },
      { code: "POTONGAN", name: "Potongan BPJS", type: "DEDUCTION", calculationType: "PERCENTAGE", defaultPercentage: 2, isActive: true },
      { code: "PAJAK", name: "PPh 21", type: "DEDUCTION", calculationType: "PERCENTAGE", defaultPercentage: 5, isActive: true },
    ],
  });

  const components = await prisma.payrollComponent.findMany();
  const employees = await prisma.employeeProfile.findMany({ take: 3 });
  for (const emp of employees) {
    await prisma.employeeSalaryComponent.createMany({
      data: components.map((c) => ({
        employeeId: emp.id,
        componentId: c.id,
        amount: c.calculationType === "FIXED" ? (c.code === "GAPOK" ? 5000000 : c.code === "TUNJANGAN" ? 1500000 : 500000) : 0,
        isActive: true,
      })),
    });
  }

  const now = new Date();
  const periodCode = `PRD-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (adminId) {
    await prisma.payrollPeriod.upsert({
      where: { code: periodCode },
      update: {},
      create: {
        code: periodCode,
        name: `Periode ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        status: "OPEN",
        createdById: adminId,
      },
    });
  }
  console.log("Payroll sample data seeded.");
}

async function seedExams(adminId: string) {
  await prisma.examParticipant.deleteMany();
  await prisma.examSession.deleteMany();
  await prisma.examSchedule.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.examRoom.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.examQuestion.deleteMany();

  const rooms = await Promise.all([
    prisma.examRoom.create({ data: { code: "RG-01", name: "Ruang 1", capacity: 30, location: "Lantai 1" } }),
    prisma.examRoom.create({ data: { code: "RG-02", name: "Ruang 2", capacity: 25, location: "Lantai 1" } }),
    prisma.examRoom.create({ data: { code: "LAB-KOM", name: "Lab Komputer", capacity: 36, location: "Lantai 2" } }),
  ]);

  let examTypes = await prisma.examType.findMany({ take: 2 });
  if (!examTypes.length) {
    examTypes = await Promise.all([
      prisma.examType.create({ data: { code: "UTS", name: "Ujian Tengah Semester", isActive: true } }),
      prisma.examType.create({ data: { code: "UAS", name: "Ujian Akhir Semester", isActive: true } }),
    ]);
  }
  const semesters = await prisma.semester.findMany({ where: { isActive: true }, take: 1 });

  if (examTypes.length && semesters.length) {
    const exam = await prisma.exam.create({
      data: {
        examTypeId: examTypes[0].id,
        academicYearId: semesters[0].academicYearId,
        semesterId: semesters[0].id,
        code: "UTS-2025-G1",
        name: "Ujian Tengah Semester Ganjil 2025/2026",
        description: "UTS untuk semua jurusan",
        duration: 120,
        status: "SCHEDULED",
        isCbt: false,
        passingScore: 70,
        maxScore: 100,
      },
    });

    const schedule = await prisma.examSchedule.create({
      data: {
        examId: exam.id,
        roomId: rooms[0].id,
        date: new Date("2025-10-15"),
        startTime: "08:00",
        endTime: "10:00",
        notes: "Sesi pagi",
      },
    });

    const students = await prisma.student.findMany({ take: 5 });
    const session = await prisma.examSession.create({
      data: {
        scheduleId: schedule.id,
        code: "SES-001",
        name: "Sesi 1 - Pagi",
        status: "PENDING",
      },
    });

    for (const student of students) {
      await prisma.examParticipant.create({
        data: { examId: exam.id, sessionId: session.id, studentId: student.id, status: "REGISTERED" },
      });
    }
  }
  console.log("Exam seed data seeded.");
}

async function seedCounseling() {
  await prisma.counselingNote.deleteMany();
  await prisma.counselingCase.deleteMany();

  const students = await prisma.student.findMany({ take: 3 });
  const teachers = await prisma.teacher.findMany({ take: 2 });

  if (!students.length || !teachers.length) {
    console.log("Counseling seed: missing prerequisite data, skipping.");
    return;
  }

  const cases = await Promise.all([
    prisma.counselingCase.create({
      data: {
        studentId: students[0].id,
        counselorId: teachers[0].userId,
        title: "Kesulitan memahami materi Matematika",
        category: "AKADEMIK",
        priority: "MEDIUM",
        status: "OPEN",
        description: "Siswa mengalami kesulitan dalam memahami materi kalkulus dasar.",
        createdById: teachers[0].userId,
      },
    }),
    prisma.counselingCase.create({
      data: {
        studentId: students.length > 1 ? students[1].id : students[0].id,
        counselorId: teachers[0].userId,
        title: "Sering terlambat masuk kelas",
        category: "DISIPLIN",
        priority: "HIGH",
        status: "OPEN",
        description: "Siswa tercatat terlambat lebih dari 5 kali dalam sebulan.",
        createdById: teachers[0].userId,
      },
    }),
    prisma.counselingCase.create({
      data: {
        studentId: students[0].id,
        counselorId: teachers.length > 1 ? teachers[1].userId : teachers[0].userId,
        title: "Konsultasi minat dan bakat",
        category: "PRIBADI",
        priority: "LOW",
        status: "CLOSED",
        description: "Siswa ingin berkonsultasi mengenai jurusan kuliah yang sesuai.",
        closedAt: new Date(),
        createdById: teachers[0].userId,
      },
    }),
  ]);

  await prisma.counselingNote.create({
    data: {
      caseId: cases[0].id,
      note: "Siswa telah diberikan bimbingan tambahan setiap hari Rabu. Perkembangan mulai terlihat.",
      createdById: teachers[0].userId,
    },
  });

  await prisma.counselingNote.create({
    data: {
      caseId: cases[0].id,
      note: "Nilai ulangan harian meningkat dari 60 menjadi 75. Perlu dipantau lanjutan.",
      createdById: teachers[0].userId,
    },
  });
  console.log("Counseling sample data seeded.");
}
