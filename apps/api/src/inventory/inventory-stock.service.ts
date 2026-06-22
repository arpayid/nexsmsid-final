import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class InventoryStockService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [totalItems, activeAssets, damagedAssets, inMaintenance, borrowedLoans, lowStockItems] = await Promise.all([
      this.prisma.inventoryItem.count({ where: { deletedAt: null } }),
      this.prisma.inventoryItem.count({ where: { deletedAt: null, status: "ACTIVE", type: "ASSET" } }),
      this.prisma.inventoryItem.count({ where: { deletedAt: null, condition: { in: ["DAMAGED", "HEAVILY_DAMAGED"] } } }),
      this.prisma.inventoryItem.count({ where: { deletedAt: null, status: "MAINTENANCE" } }),
      this.prisma.inventoryLoan.count({ where: { deletedAt: null, status: "BORROWED" } }),
      this.prisma.inventoryItem
        .findMany({ where: { deletedAt: null } })
        .then((items) => items.filter((i) => i.minStock && i.quantity <= i.minStock).length),
    ]);
    return { totalItems, activeAssets, damagedAssets, inMaintenance, borrowedLoans, lowStockItems };
  }

  async getLowStockItems() {
    const items = await this.prisma.inventoryItem.findMany({ where: { deletedAt: null }, include: { category: true, location: true } });
    return items.filter((i) => i.minStock !== null && i.quantity <= i.minStock);
  }

  async getMaintenanceDue() {
    return this.prisma.inventoryMaintenance.findMany({
      where: { deletedAt: null, status: "SCHEDULED", scheduledAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      include: { item: true },
    });
  }

  async getLoansOverdue() {
    return this.prisma.inventoryLoan.findMany({
      where: { deletedAt: null, status: "BORROWED", dueAt: { lt: new Date() } },
      include: { item: true, borrowerUser: true },
    });
  }
}
