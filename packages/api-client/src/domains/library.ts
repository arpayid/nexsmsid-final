import type { ApiClientCore } from "../client";
import { toQueryString } from "../query";
import type {
  ActionSuccess,
  LibraryBookCopyRecord,
  LibraryBookRecord,
  LibraryCategoryRecord,
  LibraryFineRecord,
  LibraryLoanRecord,
  LibraryMemberRecord,
  LibraryReservationRecord,
  LibraryShelfRecord,
  LibrarySummaryRecord,
  ListQueryParams,
  PaginatedList,
} from "../types";

export function createLibraryApi({ request, downloadFile, triggerBrowserDownload }: ApiClientCore) {
  return {
    // Categories
    async listLibraryCategories(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LibraryCategoryRecord>>(`/library/categories${toQueryString(params)}`);
      return response.data;
    },
    async createLibraryCategory(data: Record<string, unknown>) {
      const response = await request<LibraryCategoryRecord>("/library/categories", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getLibraryCategory(id: string) {
      const response = await request<LibraryCategoryRecord>(`/library/categories/${id}`);
      return response.data;
    },
    async updateLibraryCategory(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryCategoryRecord>(`/library/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteLibraryCategory(id: string) {
      const response = await request<LibraryCategoryRecord>(`/library/categories/${id}`, { method: "DELETE" });
      return response.data;
    },

    // Shelves
    async listLibraryShelves(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LibraryShelfRecord>>(`/library/shelves${toQueryString(params)}`);
      return response.data;
    },
    async createLibraryShelf(data: Record<string, unknown>) {
      const response = await request<LibraryShelfRecord>("/library/shelves", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getLibraryShelf(id: string) {
      const response = await request<LibraryShelfRecord>(`/library/shelves/${id}`);
      return response.data;
    },
    async updateLibraryShelf(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryShelfRecord>(`/library/shelves/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteLibraryShelf(id: string) {
      const response = await request<LibraryShelfRecord>(`/library/shelves/${id}`, { method: "DELETE" });
      return response.data;
    },

    // Books
    async listLibraryBooks(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LibraryBookRecord>>(`/library/books${toQueryString(params)}`);
      return response.data;
    },
    async createLibraryBook(data: Record<string, unknown>) {
      const response = await request<LibraryBookRecord>("/library/books", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getLibraryBook(id: string) {
      const response = await request<LibraryBookRecord>(`/library/books/${id}`);
      return response.data;
    },
    async updateLibraryBook(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryBookRecord>(`/library/books/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteLibraryBook(id: string) {
      const response = await request<LibraryBookRecord>(`/library/books/${id}`, { method: "DELETE" });
      return response.data;
    },

    // Copies
    async listAllLibraryCopies(params?: ListQueryParams | URLSearchParams) {
      const response = await request<LibraryBookCopyRecord[]>(`/library/copies${toQueryString(params)}`);
      return { data: response.data, meta: response.meta };
    },
    async listLibraryBookCopies(bookId: string, params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LibraryBookCopyRecord>>(`/library/books/${bookId}/copies${toQueryString(params)}`);
      return response.data;
    },
    async createLibraryBookCopy(bookId: string, data: Record<string, unknown>) {
      const response = await request<LibraryBookCopyRecord>(`/library/books/${bookId}/copies`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    async getLibraryCopy(id: string) {
      const response = await request<LibraryBookCopyRecord>(`/library/copies/${id}`);
      return response.data;
    },
    async updateLibraryCopy(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryBookCopyRecord>(`/library/copies/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteLibraryCopy(id: string) {
      const response = await request<LibraryBookCopyRecord>(`/library/copies/${id}`, { method: "DELETE" });
      return response.data;
    },

    // Members
    async listLibraryMembers(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LibraryMemberRecord>>(`/library/members${toQueryString(params)}`);
      return response.data;
    },
    async createLibraryMember(data: Record<string, unknown>) {
      const response = await request<LibraryMemberRecord>("/library/members", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getLibraryMember(id: string) {
      const response = await request<LibraryMemberRecord>(`/library/members/${id}`);
      return response.data;
    },
    async updateLibraryMember(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryMemberRecord>(`/library/members/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteLibraryMember(id: string) {
      const response = await request<LibraryMemberRecord>(`/library/members/${id}`, { method: "DELETE" });
      return response.data;
    },

    // Loans
    async listLibraryLoans(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LibraryLoanRecord>>(`/library/loans${toQueryString(params)}`);
      return response.data;
    },
    async createLibraryLoan(data: Record<string, unknown>) {
      const response = await request<LibraryLoanRecord>("/library/loans", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getLibraryLoan(id: string) {
      const response = await request<LibraryLoanRecord>(`/library/loans/${id}`);
      return response.data;
    },
    async updateLibraryLoan(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryLoanRecord>(`/library/loans/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async returnLibraryLoan(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryLoanRecord>(`/library/loans/${id}/return`, { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async markLibraryLoanLost(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryLoanRecord>(`/library/loans/${id}/mark-lost`, { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async cancelLibraryLoan(id: string) {
      const response = await request<ActionSuccess>(`/library/loans/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async deleteLibraryLoan(id: string) {
      const response = await request<LibraryLoanRecord>(`/library/loans/${id}`, { method: "DELETE" });
      return response.data;
    },

    // Reservations
    async listLibraryReservations(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LibraryReservationRecord>>(`/library/reservations${toQueryString(params)}`);
      return response.data;
    },
    async createLibraryReservation(data: Record<string, unknown>) {
      const response = await request<LibraryReservationRecord>("/library/reservations", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async getLibraryReservation(id: string) {
      const response = await request<LibraryReservationRecord>(`/library/reservations/${id}`);
      return response.data;
    },
    async markLibraryReservationReady(id: string) {
      const response = await request<LibraryReservationRecord>(`/library/reservations/${id}/mark-ready`, { method: "POST" });
      return response.data;
    },
    async cancelLibraryReservation(id: string) {
      const response = await request<ActionSuccess>(`/library/reservations/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async expireLibraryReservation(id: string) {
      const response = await request<ActionSuccess>(`/library/reservations/${id}/expire`, { method: "POST" });
      return response.data;
    },

    // Fines
    async listLibraryFines(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LibraryFineRecord>>(`/library/fines${toQueryString(params)}`);
      return response.data;
    },
    async getLibraryFine(id: string) {
      const response = await request<LibraryFineRecord>(`/library/fines/${id}`);
      return response.data;
    },
    async payLibraryFine(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryFineRecord>(`/library/fines/${id}/pay`, { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async waiveLibraryFine(id: string, data: Record<string, unknown>) {
      const response = await request<LibraryFineRecord>(`/library/fines/${id}/waive`, { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async cancelLibraryFine(id: string) {
      const response = await request<ActionSuccess>(`/library/fines/${id}/cancel`, { method: "POST" });
      return response.data;
    },

    // Summary & reports
    async getLibrarySummary() {
      const response = await request<LibrarySummaryRecord>("/library/summary");
      return response.data;
    },
    async getLibraryOverdue() {
      const response = await request<LibraryLoanRecord[]>("/library/overdue");
      return response.data;
    },
    async getLibraryAvailableBooks() {
      const response = await request<LibraryBookRecord[]>("/library/available-books");
      return response.data;
    },
    async getLibraryPopularBooks() {
      const response = await request<LibraryBookRecord[]>("/library/popular-books");
      return response.data;
    },
    async downloadLibraryBookPdf(id: string) {
      const blob = await downloadFile(`/library/books/${id}/print`, `book-${id}.pdf`);
      triggerBrowserDownload(blob, `book-${id}.pdf`);
    },
    async downloadLibraryCopyLabelPdf(id: string) {
      const blob = await downloadFile(`/library/copies/${id}/label`, `label-${id}.pdf`);
      triggerBrowserDownload(blob, `label-${id}.pdf`);
    },
    async downloadLibraryLoanReceiptPdf(id: string) {
      const blob = await downloadFile(`/library/loans/${id}/receipt`, `receipt-${id}.pdf`);
      triggerBrowserDownload(blob, `receipt-${id}.pdf`);
    },
    async downloadLibraryMemberCardPdf(id: string) {
      const blob = await downloadFile(`/library/members/${id}/card`, `member-card-${id}.pdf`);
      triggerBrowserDownload(blob, `member-card-${id}.pdf`);
    },
    async downloadLibrarySummaryPdf() {
      const blob = await downloadFile("/library/summary.pdf", "library-summary.pdf");
      triggerBrowserDownload(blob, "library-summary.pdf");
    },
    async listAllCopies(params?: ListQueryParams | URLSearchParams) {
      return request<LibraryBookCopyRecord[]>(`/library/copies${toQueryString(params)}`);
    },
  };
}
