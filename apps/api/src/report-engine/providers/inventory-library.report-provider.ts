import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ReportDataResult } from "../report-engine.types";
import { ReportProvider, ReportFilters, filterString, hasFilter, formatReportDate } from "../report-provider.interface";
import { Prisma } from "@prisma/client";

@Injectable()
export class InventoryLibraryReportProvider implements ReportProvider {
  readonly reports: Record<string, (f: ReportFilters) => Promise<ReportDataResult>>;

  constructor(private prisma: PrismaService) {
    this.reports = {
      "inventory-item-recap": this.getInventoryItemRecap.bind(this),
      "inventory-movement-recap": this.getInventoryMovementRecap.bind(this),
      "inventory-maintenance-recap": this.getInventoryMaintenanceRecap.bind(this),
      "inventory-loan-recap": this.getInventoryLoanRecap.bind(this),
      "inventory-low-stock-recap": this.getInventoryLowStockRecap.bind(this),
      "library-book-recap": this.getLibraryBookRecap.bind(this),
      "library-copy-recap": this.getLibraryCopyRecap.bind(this),
      "library-loan-recap": this.getLibraryLoanRecap.bind(this),
      "library-overdue-loan-recap": this.getLibraryOverdueLoanRecap.bind(this),
      "library-fine-recap": this.getLibraryFineRecap.bind(this),
      "library-member-recap": this.getLibraryMemberRecap.bind(this),
      "library-popular-book-recap": this.getLibraryPopularBookRecap.bind(this),
    };
  }

  supportedReports(): string[] {
    return Object.keys(this.reports);
  }
  async getData(reportCode: string, filters: ReportFilters): Promise<ReportDataResult> {
    const fn = this.reports[reportCode];
    if (!fn) throw new Error(`Report ${reportCode} not handled by InventoryLibraryReportProvider`);
    return fn(filters);
  }

  private async getInventoryItemRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InventoryItemWhereInput = { deletedAt: null };
    if (hasFilter(f, "status")) where.status = f.status as never;
    if (filterString(f, "categoryId")) where.categoryId = filterString(f, "categoryId");
    const items = await this.prisma.inventoryItem.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { category: true, location: true },
      orderBy: { name: "asc" },
    });
    return {
      title: "Inventory Item Recap",
      columns: [
        { key: "code", label: "Code", width: 15 },
        { key: "name", label: "Item Name", width: 30 },
        { key: "category", label: "Category", width: 15 },
        { key: "qty", label: "Qty", width: 10 },
        { key: "condition", label: "Condition", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i) => ({
        code: i.code,
        name: i.name,
        category: i.category?.name || "-",
        qty: i.quantity,
        condition: i.condition,
        status: i.status,
      })),
    };
  }

  private async getInventoryMovementRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.InventoryMovementWhereInput = {};
    if (filterString(f, "startDate") && filterString(f, "endDate"))
      where.performedAt = { gte: new Date(String(f.startDate)), lte: new Date(String(f.endDate)) };
    const items = await this.prisma.inventoryMovement.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { item: true, fromLocation: true, toLocation: true },
      orderBy: { performedAt: "desc" },
    });
    return {
      title: "Inventory Movement Recap",
      columns: [
        { key: "date", label: "Date", width: 15 },
        { key: "item", label: "Item", width: 30 },
        { key: "type", label: "Type", width: 15 },
        { key: "qty", label: "Qty", width: 10 },
        { key: "from", label: "From", width: 15 },
        { key: "to", label: "To", width: 15 },
      ],
      rows: items.map((i) => ({
        date: i.performedAt.toISOString().split("T")[0],
        item: i.item.name,
        type: i.type,
        qty: i.quantity,
        from: i.fromLocation?.name || "-",
        to: i.toLocation?.name || "-",
      })),
    };
  }

  private async getInventoryMaintenanceRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.inventoryMaintenance.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { item: true },
      orderBy: { scheduledAt: "asc" },
    });
    return {
      title: "Inventory Maintenance Recap",
      columns: [
        { key: "item", label: "Item", width: 30 },
        { key: "type", label: "Type", width: 15 },
        { key: "scheduled", label: "Scheduled", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((i: any) => ({
        item: i.item.name,
        type: i.maintenanceType || i.type,
        scheduled: i.scheduledAt ? i.scheduledAt.toISOString().split("T")[0] : "-",
        status: i.status,
      })),
    };
  }

  private async getInventoryLoanRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.inventoryLoan.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { item: true, borrowerUser: true },
      orderBy: { requestedAt: "desc" },
    });
    return {
      title: "Inventory Loan Recap",
      columns: [
        { key: "item", label: "Item", width: 30 },
        { key: "borrower", label: "Borrower", width: 25 },
        { key: "qty", label: "Qty", width: 10 },
        { key: "status", label: "Status", width: 15 },
        { key: "due", label: "Due Date", width: 15 },
      ],
      rows: items.map((i) => ({
        item: i.item.name,
        borrower: i.borrowerUser?.name || i.borrowerName,
        qty: i.quantity,
        status: i.status,
        due: i.dueAt ? i.dueAt.toISOString().split("T")[0] : "-",
      })),
    };
  }

  private async getInventoryLowStockRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.inventoryItem.findMany({ where: { deletedAt: null }, include: { category: true, location: true } });
    const low = items.filter((i) => i.minStock !== null && i.quantity <= i.minStock);
    return {
      title: "Inventory Low Stock Recap",
      columns: [
        { key: "code", label: "Code", width: 15 },
        { key: "name", label: "Item", width: 30 },
        { key: "qty", label: "Current Qty", width: 12 },
        { key: "min", label: "Min Stock", width: 12 },
      ],
      rows: low.map((i) => ({ code: i.code, name: i.name, qty: i.quantity, min: i.minStock })),
    };
  }

  private async getLibraryBookRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.libraryBook.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { category: true, _count: { select: { copies: { where: { deletedAt: null } } } } },
      orderBy: { title: "asc" },
    });
    return {
      title: "Library Book Recap",
      columns: [
        { key: "code", label: "Code", width: 15 },
        { key: "title", label: "Title", width: 40 },
        { key: "author", label: "Author", width: 25 },
        { key: "category", label: "Category", width: 15 },
        { key: "copies", label: "Copies", width: 10 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((b) => ({
        code: b.code,
        title: b.title,
        author: b.author || "-",
        category: b.category?.name || "-",
        copies: b._count.copies,
        status: b.status,
      })),
    };
  }

  private async getLibraryCopyRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.libraryBookCopy.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { book: { select: { title: true, code: true } } },
      orderBy: { copyCode: "asc" },
    });
    return {
      title: "Library Copy Recap",
      columns: [
        { key: "copyCode", label: "Copy Code", width: 15 },
        { key: "title", label: "Book Title", width: 40 },
        { key: "condition", label: "Condition", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((c) => ({ copyCode: c.copyCode, title: c.book.title, condition: c.condition, status: c.status })),
    };
  }

  private async getLibraryLoanRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.libraryLoan.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { member: true, copy: { include: { book: true } } },
      orderBy: { borrowedAt: "desc" },
    });
    return {
      title: "Library Loan Recap",
      columns: [
        { key: "book", label: "Book", width: 40 },
        { key: "member", label: "Member", width: 25 },
        { key: "borrowed", label: "Borrowed", width: 15 },
        { key: "due", label: "Due", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((l) => ({
        book: l.copy.book.title,
        member: l.member.externalName || l.member.memberCode,
        borrowed: l.borrowedAt.toISOString().split("T")[0],
        due: l.dueAt.toISOString().split("T")[0],
        status: l.status,
      })),
    };
  }

  private async getLibraryOverdueLoanRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.libraryLoan.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null, status: { in: ["BORROWED", "OVERDUE"] }, dueAt: { lt: new Date() } },
      include: { member: true, copy: { include: { book: true } } },
    });
    return {
      title: "Library Overdue Loan Recap",
      columns: [
        { key: "book", label: "Book", width: 40 },
        { key: "member", label: "Member", width: 25 },
        { key: "due", label: "Due", width: 15 },
        { key: "days", label: "Days Overdue", width: 15 },
      ],
      rows: items.map((l) => ({
        book: l.copy.book.title,
        member: l.member.externalName || l.member.memberCode,
        due: l.dueAt.toISOString().split("T")[0],
        days: Math.ceil((Date.now() - l.dueAt.getTime()) / 86400000),
      })),
    };
  }

  private async getLibraryFineRecap(f: ReportFilters): Promise<ReportDataResult> {
    const items = await this.prisma.libraryFine.findMany({
      take: Number(f.limit || 5000),
      where: { deletedAt: null },
      include: { member: true, loan: { include: { copy: { include: { book: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return {
      title: "Library Fine Recap",
      columns: [
        { key: "member", label: "Member", width: 25 },
        { key: "book", label: "Book", width: 40 },
        { key: "amount", label: "Amount", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((f) => ({
        member: f.member.externalName || f.member.memberCode,
        book: f.loan?.copy.book.title || "-",
        amount: Number(f.amount),
        status: f.status,
      })),
    };
  }

  private async getLibraryMemberRecap(f: ReportFilters): Promise<ReportDataResult> {
    const where: Prisma.LibraryMemberWhereInput = { deletedAt: null };
    if (hasFilter(f, "status")) where.status = f.status as never;
    if (filterString(f, "type")) where.type = f.type as never;
    const items = await this.prisma.libraryMember.findMany({
      take: Number(f.limit || 5000),
      where,
      include: { user: { select: { name: true } } },
      orderBy: { joinedAt: "desc" },
    });
    return {
      title: "Library Member Recap",
      columns: [
        { key: "code", label: "Member Code", width: 15 },
        { key: "name", label: "Name", width: 30 },
        { key: "type", label: "Type", width: 15 },
        { key: "status", label: "Status", width: 15 },
      ],
      rows: items.map((m) => ({ code: m.memberCode, name: m.externalName || m.user?.name || "-", type: m.type, status: m.status })),
    };
  }

  private async getLibraryPopularBookRecap(f: ReportFilters): Promise<ReportDataResult> {
    const popular = await this.prisma.libraryLoan.groupBy({
      by: ["copyId"],
      _count: { copyId: true },
      orderBy: { _count: { copyId: "desc" } },
      take: 20,
      where: { deletedAt: null },
    });
    const copies = await this.prisma.libraryBookCopy.findMany({
      where: { id: { in: popular.map((p) => p.copyId) } },
      include: { book: { include: { category: true } } },
    });
    const map = new Map<string, { book: (typeof copies)[0]["book"]; count: number }>();
    for (const p of popular) {
      const c = copies.find((c) => c.id === p.copyId);
      if (c) {
        const key = c.bookId;
        map.set(key, { book: c.book, count: (map.get(key)?.count || 0) + p._count.copyId });
      }
    }
    const rows = Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return {
      title: "Library Popular Books",
      columns: [
        { key: "code", label: "Code", width: 15 },
        { key: "title", label: "Title", width: 40 },
        { key: "author", label: "Author", width: 25 },
        { key: "category", label: "Category", width: 15 },
        { key: "loans", label: "Total Loans", width: 12 },
      ],
      rows: rows.map((r) => ({
        code: r.book.code,
        title: r.book.title,
        author: r.book.author || "-",
        category: r.book.category?.name || "-",
        loans: r.count,
      })),
    };
  }
}
