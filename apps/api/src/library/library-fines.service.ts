import { Inject, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LibraryFineStatus, Prisma } from "@prisma/client";
import { PayLibraryFineDto, WaiveLibraryFineDto } from "./library.dto";

@Injectable()
export class LibraryFinesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getFines(params: { page?: number; limit?: number; status?: LibraryFineStatus; memberId?: string }) {
    const { page = 1, limit = 10, status, memberId } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.LibraryFineWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    const [data, total] = await Promise.all([
      this.prisma.libraryFine.findMany({
        where,
        skip,
        take: limit,
        include: {
          member: {
            select: { memberCode: true, student: { select: { name: true } }, teacher: { select: { name: true } }, externalName: true },
          },
          loan: { select: { copy: { select: { book: { select: { title: true } } } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.libraryFine.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getFine(id: string) {
    const fine = await this.prisma.libraryFine.findFirst({
      where: { id, deletedAt: null },
      include: { member: true, loan: { include: { copy: { include: { book: true } } } } },
    });
    if (!fine) throw new NotFoundException("Fine not found");
    return fine;
  }

  async payFine(id: string, dto: PayLibraryFineDto, userId: string) {
    const fine = await this.getFine(id);
    if (fine.status !== "UNPAID") throw new BadRequestException("Fine is not unpaid");
    const updated = await this.prisma.libraryFine.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date(), handledById: userId },
    });
    await this.audit.record({ actorId: userId, action: "library.fine.pay", entity: "Paid library fine", metadata: { fineId: id } });
    return updated;
  }

  async waiveFine(id: string, dto: WaiveLibraryFineDto, userId: string) {
    const fine = await this.getFine(id);
    if (fine.status !== "UNPAID") throw new BadRequestException("Fine is not unpaid");
    const updated = await this.prisma.libraryFine.update({
      where: { id },
      data: { status: "WAIVED", waivedAt: new Date(), handledById: userId },
    });
    await this.audit.record({ actorId: userId, action: "library.fine.waive", entity: "Waived library fine", metadata: { fineId: id } });
    return updated;
  }

  async cancelFine(id: string, userId: string) {
    const fine = await this.getFine(id);
    if (fine.status !== "UNPAID") throw new BadRequestException("Fine is not unpaid");
    const updated = await this.prisma.libraryFine.update({ where: { id }, data: { status: "CANCELLED", handledById: userId } });
    await this.audit.record({ actorId: userId, action: "library.fine.cancel", entity: "Cancelled library fine", metadata: { fineId: id } });
    return updated;
  }
}
