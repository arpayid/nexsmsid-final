import type { ApiClientCore } from "../client";
import type { InvoiceRecord, PaymentRecord, ExpenseRecord, FinanceSummary } from "../types";

export function createFinanceApi({ request, downloadFile }: ApiClientCore) {
  return {
    // Phase 8 - Finance
    async listInvoices(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      const response = await request<InvoiceRecord[]>(`/invoices${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getInvoice(id: string) {
      const response = await request<InvoiceRecord>(`/invoices/${id}`);
      return response.data;
    },
    async createInvoice(input: Record<string, unknown>) {
      const response = await request<InvoiceRecord>("/invoices", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateInvoice(id: string, input: Record<string, unknown>) {
      const response = await request<InvoiceRecord>(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteInvoice(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/invoices/${id}`, { method: "DELETE" });
      return response.data;
    },
    async issueInvoice(id: string) {
      const response = await request<InvoiceRecord>(`/invoices/${id}/issue`, { method: "POST" });
      return response.data;
    },
    async cancelInvoice(id: string) {
      const response = await request<InvoiceRecord>(`/invoices/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async listPayments(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      const response = await request<PaymentRecord[]>(`/payments${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getPayment(id: string) {
      const response = await request<PaymentRecord>(`/payments/${id}`);
      return response.data;
    },
    async createPayment(input: Record<string, unknown>) {
      const response = await request<PaymentRecord>("/payments", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updatePayment(id: string, input: Record<string, unknown>) {
      const response = await request<PaymentRecord>(`/payments/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async verifyPayment(id: string, input: Record<string, unknown> = {}) {
      const response = await request<PaymentRecord>(`/payments/${id}/verify`, { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async rejectPayment(id: string, input: Record<string, unknown>) {
      const response = await request<PaymentRecord>(`/payments/${id}/reject`, { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async cancelPayment(id: string) {
      const response = await request<PaymentRecord>(`/payments/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async listExpenses(options: { page?: number; limit?: number; search?: string } = {}) {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.limit) params.set("limit", String(options.limit));
      if (options.search) params.set("search", options.search);
      const query = params.toString();
      const response = await request<ExpenseRecord[]>(`/expenses${query ? `?${query}` : ""}`);
      return { items: response.data, meta: response.meta as { total: number; page: number; limit: number } | undefined };
    },
    async getExpense(id: string) {
      const response = await request<ExpenseRecord>(`/expenses/${id}`);
      return response.data;
    },
    async createExpense(input: Record<string, unknown>) {
      const response = await request<ExpenseRecord>("/expenses", { method: "POST", body: JSON.stringify(input) });
      return response.data;
    },
    async updateExpense(id: string, input: Record<string, unknown>) {
      const response = await request<ExpenseRecord>(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(input) });
      return response.data;
    },
    async deleteExpense(id: string) {
      const response = await request<{ deleted: boolean; id: string }>(`/expenses/${id}`, { method: "DELETE" });
      return response.data;
    },
    async approveExpense(id: string) {
      const response = await request<ExpenseRecord>(`/expenses/${id}/approve`, { method: "POST" });
      return response.data;
    },
    async markExpensePaid(id: string) {
      const response = await request<ExpenseRecord>(`/expenses/${id}/mark-paid`, { method: "POST" });
      return response.data;
    },
    async financeSummary() {
      const response = await request<FinanceSummary>("/finance/summary");
      return response.data;
    },
    async financeCashflow() {
      const response = await request<Array<Record<string, unknown>>>("/finance/cashflow");
      return response.data;
    },
    async financeOutstanding() {
      const response = await request<Array<Record<string, unknown>>>("/finance/outstanding");
      return response.data;
    },

    // PDF Downloads
    async downloadInvoicePdf(id: string): Promise<Blob> {
      return downloadFile(`/invoices/${id}/pdf`, `invoice-${id}.pdf`);
    },
    async downloadPaymentReceiptPdf(id: string): Promise<Blob> {
      return downloadFile(`/payments/${id}/receipt.pdf`, `receipt-${id}.pdf`);
    },
  };
}
