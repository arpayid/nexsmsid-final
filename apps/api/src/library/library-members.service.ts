import { Inject, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LibraryMemberStatus, LibraryMemberType, Prisma } from "@prisma/client";
import { CreateLibraryMemberDto, UpdateLibraryMemberDto } from "./library.dto";

@Injectable()
export class LibraryMembersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getMembers(params: { page?: number; limit?: number; search?: string; type?: LibraryMemberType; status?: LibraryMemberStatus }) {
    const { page = 1, limit = 10, search, type, status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.LibraryMemberWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { memberCode: { contains: search, mode: "insensitive" } },
        { externalName: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { student: { name: { contains: search, mode: "insensitive" } } },
        { teacher: { name: { contains: search, mode: "insensitive" } } },
        { staff: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.libraryMember.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          student: { select: { name: true, nisn: true } },
          teacher: { select: { name: true, nip: true } },
          staff: { select: { name: true, nip: true } },
        },
        orderBy: { joinedAt: "desc" },
      }),
      this.prisma.libraryMember.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getMember(id: string) {
    const member = await this.prisma.libraryMember.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, nisn: true } },
        teacher: { select: { id: true, name: true, nip: true } },
        staff: { select: { id: true, name: true, nip: true } },
      },
    });
    if (!member) throw new NotFoundException("Member not found");
    return member;
  }

  async createMember(dto: CreateLibraryMemberDto, userId: string) {
    const existing = await this.prisma.libraryMember.findUnique({ where: { memberCode: dto.memberCode } });
    if (existing) throw new BadRequestException("Member code already exists");
    const member = await this.prisma.libraryMember.create({ data: dto });
    await this.audit.record({
      actorId: userId,
      action: "library.member.create",
      entity: "Created library member",
      metadata: { memberId: member.id },
    });
    return member;
  }

  async updateMember(id: string, dto: UpdateLibraryMemberDto, userId: string) {
    const member = await this.getMember(id);
    if (dto.memberCode && dto.memberCode !== member.memberCode) {
      const existing = await this.prisma.libraryMember.findUnique({ where: { memberCode: dto.memberCode } });
      if (existing) throw new BadRequestException("Member code already exists");
    }
    const updated = await this.prisma.libraryMember.update({ where: { id }, data: dto });
    await this.audit.record({
      actorId: userId,
      action: "library.member.update",
      entity: "Updated library member",
      metadata: { memberId: id },
    });
    return updated;
  }

  async deleteMember(id: string, userId: string) {
    await this.getMember(id);
    const loans = await this.prisma.libraryLoan.count({
      where: { memberId: id, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
    });
    if (loans > 0) throw new BadRequestException("Cannot delete member with active loans");
    await this.prisma.libraryMember.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "library.member.delete",
      entity: "Deleted library member",
      metadata: { memberId: id },
    });
    return { success: true };
  }
}
