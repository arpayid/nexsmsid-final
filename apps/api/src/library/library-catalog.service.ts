import { Inject, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LibraryBookStatus, LibraryCopyStatus, Prisma } from "@prisma/client";
import {
  CreateLibraryCategoryDto,
  UpdateLibraryCategoryDto,
  CreateLibraryShelfDto,
  UpdateLibraryShelfDto,
  CreateLibraryBookDto,
  UpdateLibraryBookDto,
  CreateLibraryBookCopyDto,
  UpdateLibraryBookCopyDto,
} from "./library.dto";

@Injectable()
export class LibraryCatalogService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly audit: AuditService,
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
      this.prisma.libraryCategory.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
      this.prisma.libraryCategory.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getCategory(id: string) {
    const category = await this.prisma.libraryCategory.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async createCategory(dto: CreateLibraryCategoryDto, userId: string) {
    const existing = await this.prisma.libraryCategory.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException("Code already exists");
    const category = await this.prisma.libraryCategory.create({ data: dto });
    await this.audit.record({
      actorId: userId,
      action: "library.category.create",
      entity: "Created library category",
      metadata: { categoryId: category.id },
    });
    return category;
  }

  async updateCategory(id: string, dto: UpdateLibraryCategoryDto, userId: string) {
    const category = await this.getCategory(id);
    if (dto.code && dto.code !== category.code) {
      const existing = await this.prisma.libraryCategory.findUnique({ where: { code: dto.code } });
      if (existing) throw new BadRequestException("Code already exists");
    }
    const updated = await this.prisma.libraryCategory.update({ where: { id }, data: dto });
    await this.audit.record({
      actorId: userId,
      action: "library.category.update",
      entity: "Updated library category",
      metadata: { categoryId: id },
    });
    return updated;
  }

  async deleteCategory(id: string, userId: string) {
    await this.getCategory(id);
    const books = await this.prisma.libraryBook.count({ where: { categoryId: id, deletedAt: null } });
    if (books > 0) throw new BadRequestException("Cannot delete category with books");
    await this.prisma.libraryCategory.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "library.category.delete",
      entity: "Deleted library category",
      metadata: { categoryId: id },
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
      this.prisma.libraryShelf.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
      this.prisma.libraryShelf.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getShelf(id: string) {
    const shelf = await this.prisma.libraryShelf.findFirst({ where: { id, deletedAt: null } });
    if (!shelf) throw new NotFoundException("Shelf not found");
    return shelf;
  }

  async createShelf(dto: CreateLibraryShelfDto, userId: string) {
    const existing = await this.prisma.libraryShelf.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException("Code already exists");
    const shelf = await this.prisma.libraryShelf.create({ data: dto });
    await this.audit.record({
      actorId: userId,
      action: "library.shelf.create",
      entity: "Created library shelf",
      metadata: { shelfId: shelf.id },
    });
    return shelf;
  }

  async updateShelf(id: string, dto: UpdateLibraryShelfDto, userId: string) {
    const shelf = await this.getShelf(id);
    if (dto.code && dto.code !== shelf.code) {
      const existing = await this.prisma.libraryShelf.findUnique({ where: { code: dto.code } });
      if (existing) throw new BadRequestException("Code already exists");
    }
    const updated = await this.prisma.libraryShelf.update({ where: { id }, data: dto });
    await this.audit.record({
      actorId: userId,
      action: "library.shelf.update",
      entity: "Updated library shelf",
      metadata: { shelfId: id },
    });
    return updated;
  }

  async deleteShelf(id: string, userId: string) {
    await this.getShelf(id);
    const books = await this.prisma.libraryBook.count({ where: { shelfId: id, deletedAt: null } });
    if (books > 0) throw new BadRequestException("Cannot delete shelf with books");
    await this.prisma.libraryShelf.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "library.shelf.delete",
      entity: "Deleted library shelf",
      metadata: { shelfId: id },
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
        include: { category: true, shelf: true, _count: { select: { copies: { where: { deletedAt: null } } } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.libraryBook.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getBook(id: string) {
    const book = await this.prisma.libraryBook.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, shelf: true, copies: { where: { deletedAt: null }, orderBy: { copyCode: "asc" } } },
    });
    if (!book) throw new NotFoundException("Book not found");
    return book;
  }

  async createBook(dto: CreateLibraryBookDto, userId: string) {
    await this.getCategory(dto.categoryId);
    if (dto.shelfId) await this.getShelf(dto.shelfId);
    const existing = await this.prisma.libraryBook.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException("Code already exists");
    const book = await this.prisma.libraryBook.create({ data: { ...dto, createdById: userId } });
    await this.audit.record({
      actorId: userId,
      action: "library.book.create",
      entity: "Created library book",
      metadata: { bookId: book.id },
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
      const existing = await this.prisma.libraryBook.findUnique({ where: { code: dto.code } });
      if (existing) throw new BadRequestException("Code already exists");
    }
    const updated = await this.prisma.libraryBook.update({ where: { id }, data: { ...dto, updatedById: userId } });
    await this.audit.record({ actorId: userId, action: "library.book.update", entity: "Updated library book", metadata: { bookId: id } });
    return updated;
  }

  async deleteBook(id: string, userId: string) {
    await this.getBook(id);
    const loans = await this.prisma.libraryLoan.count({
      where: { copy: { bookId: id }, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
    });
    if (loans > 0) throw new BadRequestException("Cannot delete book with active loans");
    await this.prisma.$transaction(async (tx) => {
      await tx.libraryBook.update({ where: { id }, data: { deletedAt: new Date() } });
      await tx.libraryBookCopy.updateMany({ where: { bookId: id, deletedAt: null }, data: { deletedAt: new Date() } });
    });
    await this.audit.record({ actorId: userId, action: "library.book.delete", entity: "Deleted library book", metadata: { bookId: id } });
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

  async getCopies(bookId: string, params: { page?: number; limit?: number; status?: LibraryCopyStatus }) {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.LibraryBookCopyWhereInput = { bookId, deletedAt: null };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.libraryBookCopy.findMany({ where, skip, take: limit, orderBy: { copyCode: "asc" } }),
      this.prisma.libraryBookCopy.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getCopy(id: string) {
    const copy = await this.prisma.libraryBookCopy.findFirst({ where: { id, deletedAt: null }, include: { book: true } });
    if (!copy) throw new NotFoundException("Copy not found");
    return copy;
  }

  async createCopy(bookId: string, dto: CreateLibraryBookCopyDto, userId: string) {
    const existing = await this.prisma.libraryBookCopy.findUnique({ where: { copyCode: dto.copyCode } });
    if (existing) throw new BadRequestException("Copy code already exists");
    const copy = await this.prisma.libraryBookCopy.create({ data: { ...dto, bookId } });
    await this.audit.record({
      actorId: userId,
      action: "library.copy.create",
      entity: "Created library book copy",
      metadata: { copyId: copy.id },
    });
    return copy;
  }

  async updateCopy(id: string, dto: UpdateLibraryBookCopyDto, userId: string) {
    const copy = await this.getCopy(id);
    if (dto.copyCode && dto.copyCode !== copy.copyCode) {
      const existing = await this.prisma.libraryBookCopy.findUnique({ where: { copyCode: dto.copyCode } });
      if (existing) throw new BadRequestException("Copy code already exists");
    }
    const updated = await this.prisma.libraryBookCopy.update({ where: { id }, data: dto });
    await this.audit.record({
      actorId: userId,
      action: "library.copy.update",
      entity: "Updated library book copy",
      metadata: { copyId: id },
    });
    return updated;
  }

  async deleteCopy(id: string, userId: string) {
    await this.getCopy(id);
    const loans = await this.prisma.libraryLoan.count({
      where: { copyId: id, status: { in: ["BORROWED", "OVERDUE"] }, deletedAt: null },
    });
    if (loans > 0) throw new BadRequestException("Cannot delete copy with active loan");
    await this.prisma.libraryBookCopy.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      actorId: userId,
      action: "library.copy.delete",
      entity: "Deleted library book copy",
      metadata: { copyId: id },
    });
    return { success: true };
  }
}
