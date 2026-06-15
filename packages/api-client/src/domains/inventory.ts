import type { ApiClientCore } from "../client";
import { toQueryString } from "../query";
import type {
  ActionSuccess,
  ApiResponse,
  InventoryCategoryRecord,
  InventoryItemRecord,
  InventoryLoanRecord,
  InventoryLocationRecord,
  InventoryMaintenanceRecord,
  InventoryMovementRecord,
  InventorySummaryRecord,
  ListQueryParams,
  PaginatedList,
} from "../types";

export function createInventoryApi({ request, downloadFile, triggerBrowserDownload }: ApiClientCore) {
  return {
    async getInventoryCategories() {
      const response = await request<InventoryCategoryRecord[]>("/inventory/categories");
      return response.data;
    },
    async createInventoryCategory(data: Record<string, unknown>) {
      const response = await request<InventoryCategoryRecord>("/inventory/categories", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getInventoryLocations() {
      const response = await request<InventoryLocationRecord[]>("/inventory/locations");
      return response.data;
    },
    async createInventoryLocation(data: Record<string, unknown>) {
      const response = await request<InventoryLocationRecord>("/inventory/locations", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getInventoryItems(query?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<InventoryItemRecord>>(`/inventory/items${toQueryString(query)}`);
      return response.data;
    },
    async getInventoryItem(id: string) {
      const response = await request<InventoryItemRecord>(`/inventory/items/${id}`);
      return response.data;
    },
    async createInventoryItem(data: Record<string, unknown>) {
      const response = await request<InventoryItemRecord>("/inventory/items", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateInventoryItem(id: string, data: Record<string, unknown>) {
      const response = await request<InventoryItemRecord>(`/inventory/items/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteInventoryItem(id: string) {
      const response = await request<InventoryItemRecord>(`/inventory/items/${id}`, { method: "DELETE" });
      return response.data;
    },
    async getInventoryMovements(query?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<InventoryMovementRecord>>(`/inventory/movements${toQueryString(query)}`);
      return response.data;
    },
    async createInventoryMovement(data: Record<string, unknown>) {
      const response = await request<InventoryMovementRecord>("/inventory/movements", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getInventoryMaintenances(query?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<InventoryMaintenanceRecord>>(`/inventory/maintenances${toQueryString(query)}`);
      return response.data;
    },
    async createInventoryMaintenance(data: Record<string, unknown>) {
      const response = await request<InventoryMaintenanceRecord>("/inventory/maintenances", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getInventoryLoans(query?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<InventoryLoanRecord>>(`/inventory/loans${toQueryString(query)}`);
      return response.data;
    },
    async createInventoryLoan(data: Record<string, unknown>) {
      const response = await request<InventoryLoanRecord>("/inventory/loans", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async approveInventoryLoan(id: string) {
      const response = await request<InventoryLoanRecord>(`/inventory/loans/${id}/approve`, { method: "POST" });
      return response.data;
    },
    async returnInventoryLoan(id: string) {
      const response = await request<InventoryLoanRecord>(`/inventory/loans/${id}/return`, { method: "POST" });
      return response.data;
    },
    async getInventorySummary() {
      const response = await request<InventorySummaryRecord>("/inventory/summary");
      return response.data;
    },
    async getInventoryLowStock() {
      return request<InventoryItemRecord[]>("/inventory/reports/low-stock");
    },
    async getInventoryMaintenanceDue() {
      return request<InventoryMaintenanceRecord[]>("/inventory/reports/maintenance-due");
    },
    async getInventoryLoansOverdue() {
      return request<InventoryLoanRecord[]>("/inventory/reports/loans-overdue");
    },

    async updateInventoryMaintenance(id: string, data: Record<string, unknown>) {
      const response = await request<InventoryMaintenanceRecord>(`/inventory/maintenances/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    async startInventoryMaintenance(id: string) {
      const response = await request<InventoryMaintenanceRecord>(`/inventory/maintenances/${id}/start`, { method: "POST" });
      return response.data;
    },
    async completeInventoryMaintenance(id: string) {
      const response = await request<InventoryMaintenanceRecord>(`/inventory/maintenances/${id}/complete`, { method: "POST" });
      return response.data;
    },
    async cancelInventoryMaintenance(id: string) {
      const response = await request<ActionSuccess>(`/inventory/maintenances/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async deleteInventoryMaintenance(id: string) {
      const response = await request<InventoryMaintenanceRecord>(`/inventory/maintenances/${id}`, { method: "DELETE" });
      return response.data;
    },
    async updateInventoryLoan(id: string, data: Record<string, unknown>) {
      const response = await request<InventoryLoanRecord>(`/inventory/loans/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async rejectInventoryLoan(id: string) {
      const response = await request<InventoryLoanRecord>(`/inventory/loans/${id}/reject`, { method: "POST" });
      return response.data;
    },
    async cancelInventoryLoan(id: string) {
      const response = await request<ActionSuccess>(`/inventory/loans/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async markInventoryLoanBorrowed(id: string) {
      const response = await request<InventoryLoanRecord>(`/inventory/loans/${id}/mark-borrowed`, { method: "POST" });
      return response.data;
    },
    async deleteInventoryLoan(id: string) {
      const response = await request<InventoryLoanRecord>(`/inventory/loans/${id}`, { method: "DELETE" });
      return response.data;
    },
    async downloadInventoryItemPdf(id: string) {
      const blob = await downloadFile(`/inventory/items/${id}/print`, `item-${id}.pdf`);
      triggerBrowserDownload(blob, `item-${id}.pdf`);
    },
    async downloadInventoryLoanPdf(id: string) {
      const blob = await downloadFile(`/inventory/loans/${id}/print`, `loan-${id}.pdf`);
      triggerBrowserDownload(blob, `loan-${id}.pdf`);
    },
    async downloadInventorySummaryPdf() {
      const blob = await downloadFile("/inventory/summary.pdf", "inventory-summary.pdf");
      triggerBrowserDownload(blob, "inventory-summary.pdf");
    },
  };
}
