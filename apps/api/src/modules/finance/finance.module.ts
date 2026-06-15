import { Module } from "@nestjs/common";
import { ExpensesModule } from "../../expenses/expenses.module";
import { FinanceDashboardModule } from "../../finance-dashboard/finance-dashboard.module";
import { InvoicesModule } from "../../invoices/invoices.module";
import { PaymentCategoriesModule } from "../../payment-categories/payment-categories.module";
import { PaymentsModule } from "../../payments/payments.module";

@Module({
  imports: [PaymentCategoriesModule, InvoicesModule, PaymentsModule, ExpensesModule, FinanceDashboardModule],
  exports: [PaymentCategoriesModule, InvoicesModule, PaymentsModule, ExpensesModule, FinanceDashboardModule],
})
export class FinanceModule {}
