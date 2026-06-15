import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { PrismaService } from "../database/prisma.service";

/** Keeps invoice status in sync when due dates pass (ISSUED/PARTIAL → OVERDUE). */
@Injectable()
export class InvoiceOverdueService {
  private readonly logger = new Logger(InvoiceOverdueService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdueInvoicesDaily() {
    const updated = await this.syncOverdueInvoices();
    if (updated > 0) {
      this.logger.log(`Marked ${updated} invoice(s) as OVERDUE`);
    }
  }

  /** Idempotent: only transitions ISSUED/PARTIAL invoices past dueDate to OVERDUE. */
  async syncOverdueInvoices(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.invoice.updateMany({
      where: {
        deletedAt: null,
        dueDate: { lt: now },
        status: { in: ["ISSUED", "PARTIAL"] },
      },
      data: { status: "OVERDUE" },
    });
    return result.count;
  }
}
