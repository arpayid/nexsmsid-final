import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  LibraryBookStatus,
  LibraryCopyStatus,
  LibraryMemberStatus,
  LibraryLoanStatus,
  LibraryReservationStatus,
  LibraryFineStatus,
  InventoryAssetCondition,
  Prisma,
} from "@prisma/client";
import { LibraryMemberType } from "@prisma/client";
import {
  CreateLibraryCategoryDto,
  UpdateLibraryCategoryDto,
  CreateLibraryShelfDto,
  UpdateLibraryShelfDto,
  CreateLibraryBookDto,
  UpdateLibraryBookDto,
  CreateLibraryBookCopyDto,
  UpdateLibraryBookCopyDto,
  CreateLibraryMemberDto,
  UpdateLibraryMemberDto,
  CreateLibraryLoanDto,
  ReturnLibraryLoanDto,
  MarkLostLibraryLoanDto,
  CreateLibraryReservationDto,
  PayLibraryFineDto,
  WaiveLibraryFineDto,
} from "./library.dto";

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // =========================================================================
  // CATEGORIES
  // =========================================================================

  async getCategories(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LibraryCategoryWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.libraryCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.libraryCategory.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getCategory(id: string) {
    const category = await this.prisma.libraryCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async createCategory(dto: CreateLibraryCategoryDto, userId: string) {
    const existing = await this.prisma.libraryCategory.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new BadRequestException("Code already exists");

    const category = await this.prisma.libraryCategory.create({
      data: dto,
    });

    await this.audit.record({
      actorId: userId,
      action: "library.category.create",
      entity: "Created library category",
      metadata: {
        categoryId: category.id,
      },
    });

    return category;
  }

  async updateCategory(id: string, dto: UpdateLibraryCategoryDto, userId: string) {
    const category = await this.getCategory(id);

    if (dto.code && dto.code !== category.code) {
      const existing = await this.prisma.libraryCategory.findUnique({
        where: { code: dto.code },
      });
      if (existing) throw new BadRequestException("Code already exists");
    }

    const updated = await this.prisma.libraryCategory.update({
      where: { id },
      data: dto,
    });

    await this.audit.record({
      actorId: userId,
      action: "library.category.update",
      entity: "Updated library category",
      metadata: {
        categoryId: id,
      },
    });

    return updated;
  }

  async deleteCategory(id: string, userId: string) {
    await this.getCategory(id);

    // Check if books use this category
    const books = await this.prisma.libraryBook.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (books > 0) throw new BadRequestException("Cannot delete category with books");

    await this.prisma.libraryCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.category.delete",
      entity: "Deleted library category",
      metadata: {
        categoryId: id,
      },
    });

    return { success: true };
  }

  // =========================================================================
  // SHELVES
  // =========================================================================

  async getShelves(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LibraryShelfWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.libraryShelf.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.libraryShelf.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getShelf(id: string) {
    const shelf = await this.prisma.libraryShelf.findFirst({
      where: { id, deletedAt: null },
    });
    if (!shelf) throw new NotFoundException("Shelf not found");
    return shelf;
  }

  async createShelf(dto: CreateLibraryShelfDto, userId: string) {
    const existing = await this.prisma.libraryShelf.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new BadRequestException("Code already exists");

    const shelf = await this.prisma.libraryShelf.create({
      data: dto,
    });

    await this.audit.record({
      actorId: userId,
      action: "library.shelf.create",
      entity: "Created library shelf",
      metadata: {
        shelfId: shelf.id,
      },
    });

    return shelf;
  }

  async updateShelf(id: string, dto: UpdateLibraryShelfDto, userId: string) {
    const shelf = await this.getShelf(id);

    if (dto.code && dto.code !== shelf.code) {
      const existing = await this.prisma.libraryShelf.findUnique({
        where: { code: dto.code },
      });
      if (existing) throw new BadRequestException("Code already exists");
    }

    const updated = await this.prisma.libraryShelf.update({
      where: { id },
      data: dto,
    });

    await this.audit.record({
      actorId: userId,
      action: "library.shelf.update",
      entity: "Updated library shelf",
      metadata: {
        shelfId: id,
      },
    });

    return updated;
  }

  async deleteShelf(id: string, userId: string) {
    await this.getShelf(id);

    // Check if books use this shelf
    const books = await this.prisma.libraryBook.count({
      where: { shelfId: id, deletedAt: null },
    });
    if (books > 0) throw new BadRequestException("Cannot delete shelf with books");

    await this.prisma.libraryShelf.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.shelf.delete",
      entity: "Deleted library shelf",
      metadata: {
        shelfId: id,
      },
    });

    return { success: true };
  }

  // =========================================================================
  // BOOKS
  // =========================================================================

  async getBooks(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    shelfId?: string;
    status?: LibraryBookStatus;
  }) {
    const { page = 1, limit = 10, search, categoryId, shelfId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LibraryBookWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (shelfId) where.shelfId = shelfId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.libraryBook.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          shelf: true,
          _count: {
            select: { copies: { where: { deletedAt: null } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.libraryBook.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getBook(id: string) {
    const book = await this.prisma.libraryBook.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        shelf: true,
        copies: {
          where: { deletedAt: null },
          orderBy: { copyCode: "asc" },
        },
      },
    });
    if (!book) throw new NotFoundException("Book not found");
    return book;
  }

  async createBook(dto: CreateLibraryBookDto, userId: string) {
    await this.getCategory(dto.categoryId);
    if (dto.shelfId) await this.getShelf(dto.shelfId);

    const existing = await this.prisma.libraryBook.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new BadRequestException("Code already exists");

    const book = await this.prisma.libraryBook.create({
      data: {
        ...dto,
        createdById: userId,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.book.create",
      entity: "Created library book",
      metadata: {
        bookId: book.id,
      },
    });

    return book;
  }

  async updateBook(id: string, dto: UpdateLibraryBookDto, userId: string) {
    const book = await this.getBook(id);

    if (dto.categoryId && dto.categoryId !== book.categoryId) {
      await this.getCategory(dto.categoryId);
    }
    if (dto.shelfId && dto.shelfId !== book.shelfId) {
      await this.getShelf(dto.shelfId);
    }
    if (dto.code && dto.code !== book.code) {
      const existing = await this.prisma.libraryBook.findUnique({
        where: { code: dto.code },
      });
      if (existing) throw new BadRequestException("Code already exists");
    }

    const updated = await this.prisma.libraryBook.update({
      where: { id },
      data: {
        ...dto,
        updatedById: userId,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.book.update",
      entity: "Updated library book",
      metadata: {
        bookId: id,
      },
    });

    return updated;
  }

  async deleteBook(id: string, userId: string) {
    await this.getBook(id);

    const loans = await this.prisma.libraryLoan.count({
      where: { copy: { bookId: id }, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
    });
    if (loans > 0) throw new BadRequestException("Cannot delete book with active loans");

    await this.prisma.$transaction(async (tx) => {
      await tx.libraryBook.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.libraryBookCopy.updateMany({
        where: { bookId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });

    await this.audit.record({
      actorId: userId,
      action: "library.book.delete",
      entity: "Deleted library book",
      metadata: {
        bookId: id,
      },
    });

    return { success: true };
  }

  // =========================================================================
  // COPIES
  // =========================================================================

  async listAllCopies(query: { page?: number | string; limit?: number | string; search?: string; status?: LibraryCopyStatus }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const search = query.search || "";
    const status = query.status || undefined;

    const where: Prisma.LibraryBookCopyWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [{ copyCode: { contains: search, mode: "insensitive" } }, { book: { title: { contains: search, mode: "insensitive" } } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.libraryBookCopy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { copyCode: "asc" },
        include: { book: { select: { title: true } } },
      }),
      this.prisma.libraryBookCopy.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getCopies(
    bookId: string,
    params: {
      page?: number;
      limit?: number;
      status?: LibraryCopyStatus;
    },
  ) {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LibraryBookCopyWhereInput = { bookId, deletedAt: null };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.libraryBookCopy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { copyCode: "asc" },
      }),
      this.prisma.libraryBookCopy.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getCopy(id: string) {
    const copy = await this.prisma.libraryBookCopy.findFirst({
      where: { id, deletedAt: null },
      include: { book: true },
    });
    if (!copy) throw new NotFoundException("Copy not found");
    return copy;
  }

  async createCopy(bookId: string, dto: CreateLibraryBookCopyDto, userId: string) {
    await this.getBook(bookId);

    const existing = await this.prisma.libraryBookCopy.findUnique({
      where: { copyCode: dto.copyCode },
    });
    if (existing) throw new BadRequestException("Copy code already exists");

    const copy = await this.prisma.libraryBookCopy.create({
      data: {
        ...dto,
        bookId,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.copy.create",
      entity: "Created library book copy",
      metadata: {
        copyId: copy.id,
      },
    });

    return copy;
  }

  async updateCopy(id: string, dto: UpdateLibraryBookCopyDto, userId: string) {
    const copy = await this.getCopy(id);

    if (dto.copyCode && dto.copyCode !== copy.copyCode) {
      const existing = await this.prisma.libraryBookCopy.findUnique({
        where: { copyCode: dto.copyCode },
      });
      if (existing) throw new BadRequestException("Copy code already exists");
    }

    const updated = await this.prisma.libraryBookCopy.update({
      where: { id },
      data: dto,
    });

    await this.audit.record({
      actorId: userId,
      action: "library.copy.update",
      entity: "Updated library book copy",
      metadata: {
        copyId: id,
      },
    });

    return updated;
  }

  async deleteCopy(id: string, userId: string) {
    await this.getCopy(id);

    const loans = await this.prisma.libraryLoan.count({
      where: { copyId: id, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
    });
    if (loans > 0) throw new BadRequestException("Cannot delete copy with active loan");

    await this.prisma.libraryBookCopy.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.copy.delete",
      entity: "Deleted library book copy",
      metadata: {
        copyId: id,
      },
    });

    return { success: true };
  }

  // =========================================================================
  // MEMBERS
  // =========================================================================

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
    const existing = await this.prisma.libraryMember.findUnique({
      where: { memberCode: dto.memberCode },
    });
    if (existing) throw new BadRequestException("Member code already exists");

    const member = await this.prisma.libraryMember.create({
      data: dto,
    });

    await this.audit.record({
      actorId: userId,
      action: "library.member.create",
      entity: "Created library member",
      metadata: {
        memberId: member.id,
      },
    });

    return member;
  }

  async updateMember(id: string, dto: UpdateLibraryMemberDto, userId: string) {
    const member = await this.getMember(id);

    if (dto.memberCode && dto.memberCode !== member.memberCode) {
      const existing = await this.prisma.libraryMember.findUnique({
        where: { memberCode: dto.memberCode },
      });
      if (existing) throw new BadRequestException("Member code already exists");
    }

    const updated = await this.prisma.libraryMember.update({
      where: { id },
      data: dto,
    });

    await this.audit.record({
      actorId: userId,
      action: "library.member.update",
      entity: "Updated library member",
      metadata: {
        memberId: id,
      },
    });

    return updated;
  }

  async deleteMember(id: string, userId: string) {
    await this.getMember(id);

    const loans = await this.prisma.libraryLoan.count({
      where: { memberId: id, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
    });
    if (loans > 0) throw new BadRequestException("Cannot delete member with active loans");

    await this.prisma.libraryMember.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.member.delete",
      entity: "Deleted library member",
      metadata: {
        memberId: id,
      },
    });

    return { success: true };
  }

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
    const member = await this.getMember(dto.memberId);
    if (member.status !== "ACTIVE") throw new BadRequestException("Member is not active");

    const copy = await this.getCopy(dto.copyId);

    const loan = await this.prisma.$transaction(async (tx) => {
      // Lock the member row so concurrent loans by the same member serialize (maxLoan check)
      await tx.$queryRaw`SELECT id FROM library_members WHERE id = ${dto.memberId} FOR UPDATE`;

      // Conditional claim: only one concurrent loan of this copy can win
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
        data: {
          memberId: dto.memberId,
          copyId: dto.copyId,
          dueAt: new Date(dto.dueAt),
          note: dto.note,
          borrowedById: userId,
        },
      });
    });

    await this.audit.record({
      actorId: userId,
      action: "library.borrow.create",
      entity: "Created library loan",
      metadata: {
        loanId: loan.id,
        copyId: dto.copyId,
      },
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
    if (loan.status !== "BORROWED" && loan.status !== "OVERDUE") {
      throw new BadRequestException("Loan is not active");
    }

    const returnedAt = new Date();
    const isOverdue = returnedAt > loan.dueAt;

    let fineAmount = 0;
    if (isOverdue) {
      const daysOverdue = Math.ceil((returnedAt.getTime() - loan.dueAt.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 1000; // Rp 1000 per day
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.libraryLoan.update({
        where: { id },
        data: {
          status: "RETURNED",
          returnedAt,
          returnNote: dto.returnNote,
          returnedById: userId,
        },
      });

      await tx.libraryBookCopy.update({
        where: { id: loan.copyId },
        data: {
          status: "AVAILABLE",
          ...(dto.condition ? { condition: dto.condition } : {}),
        },
      });

      if (fineAmount > 0) {
        await tx.libraryFine.create({
          data: {
            loanId: id,
            memberId: loan.memberId,
            amount: fineAmount,
            reason: "Denda keterlambatan pengembalian buku",
          },
        });
      }
    });

    await this.audit.record({
      actorId: userId,
      action: "library.borrow.return",
      entity: "Returned library loan",
      metadata: {
        loanId: id,
      },
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
    if (loan.status !== "BORROWED" && loan.status !== "OVERDUE") {
      throw new BadRequestException("Loan is not active");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.libraryLoan.update({
        where: { id },
        data: {
          status: "LOST",
          returnNote: dto.returnNote,
          returnedById: userId,
        },
      });

      await tx.libraryBookCopy.update({
        where: { id: loan.copyId },
        data: { status: "LOST" },
      });
    });

    await this.audit.record({
      actorId: userId,
      action: "library.borrow.lost",
      entity: "Marked loan as lost",
      metadata: {
        loanId: id,
      },
    });

    return { success: true };
  }

  async cancelLoan(id: string, userId: string) {
    const loan = await this.getLoan(id);
    if (loan.status !== "BORROWED") throw new BadRequestException("Only newly borrowed loans can be cancelled");

    await this.prisma.$transaction(async (tx) => {
      await tx.libraryLoan.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      await tx.libraryBookCopy.update({
        where: { id: loan.copyId },
        data: { status: "AVAILABLE" },
      });
    });

    await this.audit.record({
      actorId: userId,
      action: "library.borrow.cancel",
      entity: "Cancelled library loan",
      metadata: {
        loanId: id,
      },
    });

    return { success: true };
  }

  async deleteLoan(id: string, userId: string) {
    const loan = await this.getLoan(id);
    if (loan.status === "BORROWED" || loan.status === "OVERDUE") {
      throw new BadRequestException("Cannot delete active loan");
    }

    await this.prisma.libraryLoan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

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
    const res = await this.prisma.libraryReservation.findFirst({
      where: { id, deletedAt: null },
      include: { member: true, book: true },
    });
    if (!res) throw new NotFoundException("Reservation not found");
    return res;
  }

  async createReservation(dto: CreateLibraryReservationDto, userId: string) {
    const member = await this.getMember(dto.memberId);
    if (member.status !== "ACTIVE") throw new BadRequestException("Member is not active");
    const book = await this.getBook(dto.bookId);
    if (book.status !== "ACTIVE") throw new BadRequestException("Book is not active");

    const reservation = await this.prisma.libraryReservation.create({
      data: dto,
    });

    await this.audit.record({
      actorId: userId,
      action: "library.reservation.create",
      entity: "Created reservation",
      metadata: {
        reservationId: reservation.id,
      },
    });

    return reservation;
  }

  async markReservationReady(id: string, userId: string) {
    const res = await this.getReservation(id);
    if (res.status !== "PENDING") throw new BadRequestException("Reservation must be pending");

    const updated = await this.prisma.libraryReservation.update({
      where: { id },
      data: { status: "READY", readyAt: new Date() },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.reservation.ready",
      entity: "Marked reservation ready",
      metadata: {
        reservationId: id,
      },
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
    if (res.status !== "PENDING" && res.status !== "READY") {
      throw new BadRequestException("Cannot cancel this reservation");
    }

    const updated = await this.prisma.libraryReservation.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.reservation.cancel",
      entity: "Cancelled reservation",
      metadata: {
        reservationId: id,
      },
    });

    return updated;
  }

  async expireReservation(id: string, userId: string) {
    const res = await this.getReservation(id);
    if (res.status !== "READY") throw new BadRequestException("Only READY reservations can expire");

    const updated = await this.prisma.libraryReservation.update({
      where: { id },
      data: { status: "EXPIRED", expiredAt: new Date() },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.reservation.expire",
      entity: "Expired reservation",
      metadata: {
        reservationId: id,
      },
    });

    return updated;
  }

  // =========================================================================
  // FINES
  // =========================================================================

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

    await this.audit.record({
      actorId: userId,
      action: "library.fine.pay",
      entity: "Paid library fine",
      metadata: {
        fineId: id,
      },
    });

    return updated;
  }

  async waiveFine(id: string, dto: WaiveLibraryFineDto, userId: string) {
    const fine = await this.getFine(id);
    if (fine.status !== "UNPAID") throw new BadRequestException("Fine is not unpaid");

    const updated = await this.prisma.libraryFine.update({
      where: { id },
      data: { status: "WAIVED", waivedAt: new Date(), handledById: userId },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.fine.waive",
      entity: "Waived library fine",
      metadata: {
        fineId: id,
      },
    });

    return updated;
  }

  async cancelFine(id: string, userId: string) {
    const fine = await this.getFine(id);
    if (fine.status !== "UNPAID") throw new BadRequestException("Fine is not unpaid");

    const updated = await this.prisma.libraryFine.update({
      where: { id },
      data: { status: "CANCELLED", handledById: userId },
    });

    await this.audit.record({
      actorId: userId,
      action: "library.fine.cancel",
      entity: "Cancelled library fine",
      metadata: {
        fineId: id,
      },
    });

    return updated;
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================

  async getSummary() {
    const [totalBooks, totalCopies, availableCopies, borrowedCopies, overdueLoans, unpaidFinesAgg] = await Promise.all([
      this.prisma.libraryBook.count({ where: { deletedAt: null } }),
      this.prisma.libraryBookCopy.count({ where: { deletedAt: null, book: { deletedAt: null } } }),
      this.prisma.libraryBookCopy.count({ where: { status: "AVAILABLE", deletedAt: null, book: { deletedAt: null } } }),
      this.prisma.libraryBookCopy.count({ where: { status: "BORROWED", deletedAt: null, book: { deletedAt: null } } }),
      this.prisma.libraryLoan.count({ where: { status: { in: ["BORROWED", "OVERDUE"] }, dueAt: { lt: new Date() }, deletedAt: null } }),
      this.prisma.libraryFine.aggregate({ _sum: { amount: true }, where: { status: "UNPAID", deletedAt: null } }),
    ]);

    return {
      totalBooks,
      totalCopies,
      availableCopies,
      borrowedCopies,
      overdueLoans,
      unpaidFines: unpaidFinesAgg._sum.amount || 0,
    };
  }

  async getOverdue() {
    return this.prisma.libraryLoan.findMany({
      where: {
        status: { in: ["BORROWED", "OVERDUE"] },
        dueAt: { lt: new Date() },
        deletedAt: null,
      },
      include: {
        member: { include: { student: true, teacher: true, staff: true } },
        copy: { include: { book: true } },
      },
    });
  }

  async getAvailableBooks() {
    return this.prisma.libraryBook.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        copies: { some: { status: "AVAILABLE", deletedAt: null } },
      },
      take: 10,
    });
  }

  async getPopularBooks() {
    // Top 10 most borrowed books
    const popular = await this.prisma.libraryLoan.groupBy({
      by: ["copyId"],
      _count: { copyId: true },
      orderBy: { _count: { copyId: "desc" } },
      take: 20,
      where: { deletedAt: null },
    });

    // Actually we need to group by bookId, so let's do a raw or just fetch books
    const copies = await this.prisma.libraryBookCopy.findMany({
      where: { id: { in: popular.map((p) => p.copyId) } },
      include: { book: true },
    });

    const bookCounts = new Map<string, number>();
    for (const p of popular) {
      const copy = copies.find((c) => c.id === p.copyId);
      if (copy) {
        bookCounts.set(copy.bookId, (bookCounts.get(copy.bookId) || 0) + p._count.copyId);
      }
    }

    const bookIds = Array.from(bookCounts.keys());
    const books = await this.prisma.libraryBook.findMany({
      where: { id: { in: bookIds } },
    });

    const result = books
      .map((b) => ({
        ...b,
        borrowCount: bookCounts.get(b.id) || 0,
      }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10);

    return result;
  }
}
