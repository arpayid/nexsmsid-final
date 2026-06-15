import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class FinanceDashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async summary() {
    const [invoices, verifiedPayments, pendingPayments, expenses, outstanding] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { deletedAt: null }, _sum: { total: true, paidAmount: true }, _count: true }),
      this.prisma.payment.aggregate({ where: { status: "VERIFIED" }, _sum: { amount: true }, _count: true }),
      this.prisma.payment.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: true }),
      this.prisma.expense.aggregate({ where: { deletedAt: null, status: { not: "CANCELLED" } }, _sum: { amount: true }, _count: true }),
      this.prisma.invoice.findMany({
        where: { deletedAt: null, status: { in: ["ISSUED", "PARTIAL"] } },
        select: { total: true, paidAmount: true },
        take: 100,
      }),
    ]);

    const outstandingTotal = outstanding.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)), 0);

    return {
      totalInvoices: invoices._count,
      totalInvoiceAmount: Number(invoices._sum.total ?? 0),
      totalPaid: Number(invoices._sum.paidAmount ?? 0),
      collectedPayments: { count: verifiedPayments._count, amount: Number(verifiedPayments._sum.amount ?? 0) },
      pendingPayments: { count: pendingPayments._count, amount: Number(pendingPayments._sum.amount ?? 0) },
      totalExpenses: expenses._count,
      totalExpenseAmount: Number(expenses._sum.amount ?? 0),
      outstandingInvoices: outstanding.length,
      outstandingAmount: outstandingTotal,
      netIncome: Number(invoices._sum.paidAmount ?? 0) - Number(expenses._sum.amount ?? 0),
    };
  }

  async cashflow() {
    const payments = await this.prisma.payment.findMany({
      where: { status: "VERIFIED" },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { status: { in: ["APPROVED", "PAID"] }, deletedAt: null },
      select: { amount: true, date: true, status: true },
      orderBy: { date: "asc" },
    });

    const monthlyMap = new Map<string, { income: number; expense: number }>();

    for (const p of payments) {
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key) ?? { income: 0, expense: 0 };
      entry.income += Number(p.amount);
      monthlyMap.set(key, entry);
    }

    for (const e of expenses) {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key) ?? { income: 0, expense: 0 };
      entry.expense += Number(e.amount);
      monthlyMap.set(key, entry);
    }

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }

  async outstanding() {
    const invoices = await this.prisma.invoice.findMany({
      where: { deletedAt: null, status: { in: ["ISSUED", "PARTIAL"] } },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        paidAmount: true,
        dueDate: true,
        status: true,
        student: { select: { name: true, nis: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
    });

    return invoices.map((inv) => ({
      ...inv,
      total: Number(inv.total),
      paidAmount: Number(inv.paidAmount),
      outstanding: Number(inv.total) - Number(inv.paidAmount),
    }));
  }
}
