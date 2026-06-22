import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LibraryLoanStatus, LibraryReservationStatus, Prisma } from "@prisma/client";
import { CreateLibraryLoanDto, ReturnLibraryLoanDto, MarkLostLibraryLoanDto, CreateLibraryReservationDto } from "./library.dto";

@Injectable()
export class LibraryCirculationService {
  private readonly logger = new Logger(LibraryCirculationService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // =========================================================================
  // LOANS
  // =========================================================================

  async getLoans(params: { page?: number; limit?: number; status?: LibraryLoanStatus; memberId?: string; overdueOnly?: boolean }) {
    const { page = 1, limit = 10, status, memberId, overdueOnly } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.LibraryLoanWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    if (overdueOnly) {
      where.status = { in: ["BORROWED", "OVERDUE"] };
      where.dueAt = { lt: new Date() };
    }
    const [data, total] = await Promise.all([
      this.prisma.libraryLoan.findMany({
        where,
        skip,
        take: limit,
        include: {
          member: {
            select: {
              memberCode: true,
              type: true,
              student: { select: { name: true } },
              teacher: { select: { name: true } },
              externalName: true,
            },
          },
          copy: { select: { copyCode: true, book: { select: { title: true } } } },
        },
        orderBy: { borrowedAt: "desc" },
      }),
      this.prisma.libraryLoan.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getLoan(id: string) {
    const loan = await this.prisma.libraryLoan.findFirst({
      where: { id, deletedAt: null },
      include: {
        member: true,
        copy: { include: { book: true } },
        borrowedBy: { select: { name: true } },
        returnedBy: { select: { name: true } },
        fines: { where: { deletedAt: null } },
      },
    });
    if (!loan) throw new NotFoundException("Loan not found");
    return loan;
  }

  async createLoan(dto: CreateLibraryLoanDto, userId: string) {
    const copy = await this.prisma.libraryBookCopy.findFirst({ where: { id: dto.copyId, deletedAt: null }, include: { book: true } });
    if (!copy) throw new NotFoundException("Copy not found");
    const member = await this.prisma.libraryMember.findFirst({ where: { id: dto.memberId, deletedAt: null } });
    if (!member) throw new NotFoundException("Member not found");
    if (member.status !== "ACTIVE") throw new BadRequestException("Member is not active");

    const loan = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM library_members WHERE id = ${dto.memberId} FOR UPDATE`;
      const claimed = await tx.libraryBookCopy.updateMany({
        where: { id: dto.copyId, status: "AVAILABLE" },
        data: { status: "BORROWED" },
      });
      if (claimed.count === 0) throw new BadRequestException("Copy is not available");
      const activeLoansCount = await tx.libraryLoan.count({
        where: { memberId: dto.memberId, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
      });
      if (activeLoansCount >= member.maxLoan) {
        throw new BadRequestException("Member reached maximum loan limit");
      }
      return tx.libraryLoan.create({
        data: { memberId: dto.memberId, copyId: dto.copyId, dueAt: new Date(dto.dueAt), note: dto.note, borrowedById: userId },
      });
    });

    await this.audit.record({
      actorId: userId,
      action: "library.borrow.create",
      entity: "Created library loan",
      metadata: { loanId: loan.id, copyId: dto.copyId },
    });
    if (member.userId) {
      this.notifications
        .createSystemNotification({
          userId: member.userId,
          title: "Buku Berhasil Dipinjam",
          body: `Anda meminjam buku ${copy.book.title}. Jatuh tempo pada ${new Date(dto.dueAt).toLocaleDateString()}`,
        })
        .catch((e: unknown) => this.logger.error("Failed to notify member", e));
    }
    return loan;
  }

  async returnLoan(id: string, dto: ReturnLibraryLoanDto, userId: string) {
    const loan = await this.getLoan(id);
    if (loan.status !== "BORROWED" && loan.status !== "OVERDUE") throw new BadRequestException("Loan is not active");
    const returnedAt = new Date();
    const isOverdue = returnedAt > loan.dueAt;
    let fineAmount = 0;
    if (isOverdue) {
      const daysOverdue = Math.ceil((returnedAt.getTime() - loan.dueAt.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 1000;
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.libraryLoan.update({
        where: { id },
        data: { status: "RETURNED", returnedAt, returnNote: dto.returnNote, returnedById: userId },
      });
      await tx.libraryBookCopy.update({
        where: { id: loan.copyId },
        data: { status: "AVAILABLE", ...(dto.condition ? { condition: dto.condition } : {}) },
      });
      if (fineAmount > 0) {
        await tx.libraryFine.create({
          data: { loanId: id, memberId: loan.memberId, amount: fineAmount, reason: "Denda keterlambatan pengembalian buku" },
        });
      }
    });
    await this.audit.record({
      actorId: userId,
      action: "library.borrow.return",
      entity: "Returned library loan",
      metadata: { loanId: id },
    });
    if (loan.member.userId) {
      this.notifications
        .createSystemNotification({
          userId: loan.member.userId,
          title: "Buku Dikembalikan",
          body: `Terima kasih telah mengembalikan buku ${loan.copy.book.title}.`,
        })
        .catch((e: unknown) => this.logger.error("Failed to notify member", e));
    }
    return { success: true, fineAmount };
  }

  async markLostLoan(id: string, dto: MarkLostLibraryLoanDto, userId: string) {
    const loan = await this.getLoan(id);
    if (loan.status !== "BORROWED" && loan.status !== "OVERDUE") throw new BadRequestException("Loan is not active");
    await this.prisma.$transaction(async (tx) => {
      await tx.libraryLoan.update({ where: { id }, data: { status: "LOST", returnNote: dto.returnNote, returnedById: userId } });
      await tx.libraryBookCopy.update({ where: { id: loan.copyId }, data: { status: "LOST" } });
    });
    await this.audit.record({ actorId: userId, action: "library.borrow.lost", entity: "Marked loan as lost", metadata: { loanId: id } });
    return { success: true };
  }

  async cancelLoan(id: string, userId: string) {
    const loan = await this.getLoan(id);
    if (loan.status !== "BORROWED") throw new BadRequestException("Only newly borrowed loans can be cancelled");
    await this.prisma.$transaction(async (tx) => {
      await tx.libraryLoan.update({ where: { id }, data: { status: "CANCELLED" } });
      await tx.libraryBookCopy.update({ where: { id: loan.copyId }, data: { status: "AVAILABLE" } });
    });
    await this.audit.record({
      actorId: userId,
      action: "library.borrow.cancel",
      entity: "Cancelled library loan",
      metadata: { loanId: id },
    });
    return { success: true };
  }

  async deleteLoan(id: string, userId: string) {
    const loan = await this.getLoan(id);
    if (loan.status === "BORROWED" || loan.status === "OVERDUE") throw new BadRequestException("Cannot delete active loan");
    await this.prisma.libraryLoan.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // =========================================================================
  // RESERVATIONS
  // =========================================================================

  async getReservations(params: { page?: number; limit?: number; status?: LibraryReservationStatus; memberId?: string }) {
    const { page = 1, limit = 10, status, memberId } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.LibraryReservationWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    const [data, total] = await Promise.all([
      this.prisma.libraryReservation.findMany({
        where,
        skip,
        take: limit,
        include: {
          member: { select: { memberCode: true, type: true, student: { select: { name: true } } } },
          book: { select: { title: true, code: true } },
        },
        orderBy: { requestedAt: "desc" },
      }),
      this.prisma.libraryReservation.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getReservation(id: string) {
    const res = await this.prisma.libraryReservation.findFirst({ where: { id, deletedAt: null }, include: { member: true, book: true } });
    if (!res) throw new NotFoundException("Reservation not found");
    return res;
  }

  async createReservation(dto: CreateLibraryReservationDto, userId: string) {
    const member = await this.prisma.libraryMember.findFirst({ where: { id: dto.memberId, deletedAt: null } });
    if (!member) throw new NotFoundException("Member not found");
    if (member.status !== "ACTIVE") throw new BadRequestException("Member is not active");
    const reservation = await this.prisma.libraryReservation.create({ data: dto });
    await this.audit.record({
      actorId: userId,
      action: "library.reservation.create",
      entity: "Created reservation",
      metadata: { reservationId: reservation.id },
    });
    return reservation;
  }

  async markReservationReady(id: string, userId: string) {
    const res = await this.getReservation(id);
    if (res.status !== "PENDING") throw new BadRequestException("Reservation must be pending");
    const updated = await this.prisma.libraryReservation.update({ where: { id }, data: { status: "READY", readyAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "library.reservation.ready",
      entity: "Marked reservation ready",
      metadata: { reservationId: id },
    });
    if (res.member.userId) {
      this.notifications
        .createSystemNotification({
          userId: res.member.userId,
          title: "Buku Tersedia",
          body: `Buku ${res.book.title} yang Anda reservasi sudah tersedia untuk diambil.`,
        })
        .catch((e: unknown) => this.logger.error("Failed to notify member", e));
    }
    return updated;
  }

  async cancelReservation(id: string, userId: string) {
    const res = await this.getReservation(id);
    if (res.status !== "PENDING" && res.status !== "READY") throw new BadRequestException("Cannot cancel this reservation");
    const updated = await this.prisma.libraryReservation.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "library.reservation.cancel",
      entity: "Cancelled reservation",
      metadata: { reservationId: id },
    });
    return updated;
  }

  async expireReservation(id: string, userId: string) {
    const res = await this.getReservation(id);
    if (res.status !== "READY") throw new BadRequestException("Only READY reservations can expire");
    const updated = await this.prisma.libraryReservation.update({ where: { id }, data: { status: "EXPIRED", expiredAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "library.reservation.expire",
      entity: "Expired reservation",
      metadata: { reservationId: id },
    });
    return updated;
  }
}
