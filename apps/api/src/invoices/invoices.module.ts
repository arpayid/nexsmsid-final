import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { InvoiceOverdueService } from "./invoice-overdue.service";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";

@Module({
  imports: [AuthModule, NotificationsModule, ScheduleModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceOverdueService],
  exports: [InvoicesService, InvoiceOverdueService],
})
export class InvoicesModule {}
