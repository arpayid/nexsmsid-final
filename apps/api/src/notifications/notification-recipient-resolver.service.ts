import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class NotificationRecipientResolverService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async activeUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  async roleUsers(roleSlugs: string | string[]) {
    const slugs = Array.isArray(roleSlugs) ? roleSlugs : [roleSlugs];
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        roles: { some: { role: { slug: { in: slugs }, isActive: true } } },
      },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  async announcementAudienceUsers(audience: string) {
    switch (audience) {
      case "ALL":
        return this.activeUsers();
      case "STUDENTS":
        return this.roleUsers("siswa");
      case "TEACHERS":
        return this.roleUsers(["guru", "wali-kelas"]);
      case "PARENTS":
        return this.roleUsers("orang-tua-wali");
      case "STAFF":
        return this.roleUsers([
          "super-admin",
          "admin-sekolah",
          "kepala-sekolah",
          "waka-kurikulum",
          "waka-kesiswaan",
          "bendahara",
          "staff-tu",
          "panitia-ppdb",
          "admin-bkk",
          "pembimbing-pkl",
        ]);
      default:
        return [];
    }
  }

  async studentUser(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { userId: true },
    });
    return student?.userId ? [student.userId] : [];
  }

  async guardiansOfStudent(studentId: string) {
    const guardians = await this.prisma.studentGuardian.findMany({
      where: { studentId },
      include: { guardian: { select: { userId: true } } },
    });
    return guardians.map((link) => link.guardian.userId).filter((userId): userId is string => Boolean(userId));
  }

  async guardianUser(guardianId: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { id: guardianId },
      select: { userId: true },
    });
    return guardian?.userId ? [guardian.userId] : [];
  }

  async teachers(teacherIds: string[]) {
    if (!teacherIds.length) return [];
    const teachers = await this.prisma.teacher.findMany({
      where: { id: { in: teacherIds }, deletedAt: null },
      select: { userId: true },
    });
    return teachers.map((teacher) => teacher.userId).filter((userId): userId is string => Boolean(userId));
  }

  async userByEmail(email?: string | null) {
    if (!email) return [];
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    return user ? [user.id] : [];
  }

  async ppdbConvertedStudentUser(registrationId: string) {
    const registration = await this.prisma.ppdbRegistration.findFirst({
      where: { id: registrationId },
      include: { convertedStudent: { select: { userId: true } } },
    });
    return registration?.convertedStudent?.userId ? [registration.convertedStudent.userId] : [];
  }

  async jobApplicationUser(applicationId: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId },
      include: { alumni: { include: { student: { select: { userId: true } } } } },
    });
    return application?.alumni?.student?.userId ? [application.alumni.student.userId] : [];
  }
}
