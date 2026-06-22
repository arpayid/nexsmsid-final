import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class LibraryDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [totalBooks, totalCopies, availableCopies, borrowedCopies, overdueLoans, unpaidFinesAgg] = await Promise.all([
      this.prisma.libraryBook.count({ where: { deletedAt: null } }),
      this.prisma.libraryBookCopy.count({ where: { deletedAt: null, book: { deletedAt: null } } }),
      this.prisma.libraryBookCopy.count({ where: { status: "AVAILABLE", deletedAt: null, book: { deletedAt: null } } }),
      this.prisma.libraryBookCopy.count({ where: { status: "BORROWED", deletedAt: null, book: { deletedAt: null } } }),
      this.prisma.libraryLoan.count({ where: { status: { in: ["BORROWED", "OVERDUE"] }, dueAt: { lt: new Date() }, deletedAt: null } }),
      this.prisma.libraryFine.aggregate({ _sum: { amount: true }, where: { status: "UNPAID", deletedAt: null } }),
    ]);
    return { totalBooks, totalCopies, availableCopies, borrowedCopies, overdueLoans, unpaidFines: unpaidFinesAgg._sum.amount || 0 };
  }

  async getOverdue() {
    return this.prisma.libraryLoan.findMany({
      where: { status: { in: ["BORROWED", "OVERDUE"] }, dueAt: { lt: new Date() }, deletedAt: null },
      include: { member: { include: { student: true, teacher: true, staff: true } }, copy: { include: { book: true } } },
    });
  }

  async getAvailableBooks() {
    return this.prisma.libraryBook.findMany({
      where: { status: "ACTIVE", deletedAt: null, copies: { some: { status: "AVAILABLE", deletedAt: null } } },
      take: 10,
    });
  }

  async getPopularBooks() {
    const popular = await this.prisma.libraryLoan.groupBy({
      by: ["copyId"],
      _count: { copyId: true },
      orderBy: { _count: { copyId: "desc" } },
      take: 20,
      where: { deletedAt: null },
    });
    const copies = await this.prisma.libraryBookCopy.findMany({
      where: { id: { in: popular.map((p) => p.copyId) } },
      include: { book: true },
    });
    const bookCounts = new Map<string, number>();
    for (const p of popular) {
      const copy = copies.find((c) => c.id === p.copyId);
      if (copy) bookCounts.set(copy.bookId, (bookCounts.get(copy.bookId) || 0) + p._count.copyId);
    }
    const bookIds = Array.from(bookCounts.keys());
    const books = await this.prisma.libraryBook.findMany({ where: { id: { in: bookIds } } });
    return books
      .map((b) => ({ ...b, borrowCount: bookCounts.get(b.id) || 0 }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10);
  }
}
