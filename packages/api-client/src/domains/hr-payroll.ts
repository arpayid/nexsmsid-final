import type { ApiClientCore } from "../client";
import { toQueryString } from "../query";
import type {
  EmployeeAttendanceRecord,
  EmployeeProfileRecord,
  EmployeeSalaryComponentRecord,
  HRPositionRecord,
  HRSummaryRecord,
  LeaveRequestRecord,
  ListQueryParams,
  PaginatedList,
  PayrollComponentRecord,
  PayrollPaymentRecord,
  PayrollPeriodRecord,
  PayrollRunRecord,
  PayrollSummaryRecord,
  PayslipRecord,
} from "../types";

export function createHrPayrollApi({ request, downloadFile, triggerBrowserDownload, normalizeListResponse }: ApiClientCore) {
  return {
    async getHRSummary() {
      const response = await request<HRSummaryRecord>("/hr/summary");
      return response.data;
    },
    async listHRPositions(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<HRPositionRecord>>(`/hr/positions${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getHRPosition(id: string) {
      const response = await request<HRPositionRecord>(`/hr/positions/${id}`);
      return response.data;
    },
    async createHRPosition(data: Record<string, unknown>) {
      const response = await request<HRPositionRecord>("/hr/positions", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateHRPosition(id: string, data: Record<string, unknown>) {
      const response = await request<HRPositionRecord>(`/hr/positions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteHRPosition(id: string) {
      const response = await request<HRPositionRecord>(`/hr/positions/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listEmployees(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<EmployeeProfileRecord>>(`/hr/employees${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getEmployee(id: string) {
      const response = await request<EmployeeProfileRecord>(`/hr/employees/${id}`);
      return response.data;
    },
    async createEmployee(data: Record<string, unknown>) {
      const response = await request<EmployeeProfileRecord>("/hr/employees", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateEmployee(id: string, data: Record<string, unknown>) {
      const response = await request<EmployeeProfileRecord>(`/hr/employees/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteEmployee(id: string) {
      const response = await request<EmployeeProfileRecord>(`/hr/employees/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listEmployeeAttendance(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<EmployeeAttendanceRecord>>(`/hr/attendance${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async createEmployeeAttendance(data: Record<string, unknown>) {
      const response = await request<EmployeeAttendanceRecord>("/hr/attendance", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateEmployeeAttendance(id: string, data: Record<string, unknown>) {
      const response = await request<EmployeeAttendanceRecord>(`/hr/attendance/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deleteEmployeeAttendance(id: string) {
      const response = await request<EmployeeAttendanceRecord>(`/hr/attendance/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listLeaveRequests(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<LeaveRequestRecord>>(`/hr/leaves${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getLeaveRequest(id: string) {
      const response = await request<LeaveRequestRecord>(`/hr/leaves/${id}`);
      return response.data;
    },
    async createLeaveRequest(data: Record<string, unknown>) {
      const response = await request<LeaveRequestRecord>("/hr/leaves", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updateLeaveRequest(id: string, data: Record<string, unknown>) {
      const response = await request<LeaveRequestRecord>(`/hr/leaves/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async approveLeaveRequest(id: string) {
      const response = await request<LeaveRequestRecord>(`/hr/leaves/${id}/approve`, { method: "POST" });
      return response.data;
    },
    async rejectLeaveRequest(id: string, data: Record<string, unknown>) {
      const response = await request<LeaveRequestRecord>(`/hr/leaves/${id}/reject`, { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async cancelLeaveRequest(id: string) {
      const response = await request<LeaveRequestRecord>(`/hr/leaves/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async deleteLeaveRequest(id: string) {
      const response = await request<LeaveRequestRecord>(`/hr/leaves/${id}`, { method: "DELETE" });
      return response.data;
    },

    async getPayrollSummary() {
      const response = await request<PayrollSummaryRecord>("/payroll/summary");
      return response.data;
    },
    async listPayrollComponents(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<PayrollComponentRecord>>(`/payroll/components${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getPayrollComponent(id: string) {
      const response = await request<PayrollComponentRecord>(`/payroll/components/${id}`);
      return response.data;
    },
    async createPayrollComponent(data: Record<string, unknown>) {
      const response = await request<PayrollComponentRecord>("/payroll/components", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updatePayrollComponent(id: string, data: Record<string, unknown>) {
      const response = await request<PayrollComponentRecord>(`/payroll/components/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deletePayrollComponent(id: string) {
      const response = await request<PayrollComponentRecord>(`/payroll/components/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listEmployeeComponents(employeeId: string) {
      const response = await request<EmployeeSalaryComponentRecord[]>(`/payroll/employees/${employeeId}/components`);
      return response.data;
    },
    async createEmployeeSalaryComponent(data: Record<string, unknown>) {
      const response = await request<EmployeeSalaryComponentRecord>("/payroll/employee-components", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    async updateEmployeeSalaryComponent(id: string, data: Record<string, unknown>) {
      const response = await request<EmployeeSalaryComponentRecord>(`/payroll/employee-components/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    async deleteEmployeeSalaryComponent(id: string) {
      const response = await request<EmployeeSalaryComponentRecord>(`/payroll/employee-components/${id}`, { method: "DELETE" });
      return response.data;
    },
    async listPayrollPeriods(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<PayrollPeriodRecord>>(`/payroll/periods${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getPayrollPeriod(id: string) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}`);
      return response.data;
    },
    async createPayrollPeriod(data: Record<string, unknown>) {
      const response = await request<PayrollPeriodRecord>("/payroll/periods", { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async updatePayrollPeriod(id: string, data: Record<string, unknown>) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async deletePayrollPeriod(id: string) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}`, { method: "DELETE" });
      return response.data;
    },
    async openPayrollPeriod(id: string) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}/open`, { method: "POST" });
      return response.data;
    },
    async calculatePayrollPeriod(id: string) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}/calculate`, { method: "POST" });
      return response.data;
    },
    async approvePayrollPeriod(id: string) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}/approve`, { method: "POST" });
      return response.data;
    },
    async payPayrollPeriod(id: string) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}/pay`, { method: "POST" });
      return response.data;
    },
    async closePayrollPeriod(id: string) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}/close`, { method: "POST" });
      return response.data;
    },
    async cancelPayrollPeriod(id: string) {
      const response = await request<PayrollPeriodRecord>(`/payroll/periods/${id}/cancel`, { method: "POST" });
      return response.data;
    },
    async listPayrollRuns(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<PayrollRunRecord>>(`/payroll/runs${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getPayrollRun(id: string) {
      const response = await request<PayrollRunRecord>(`/payroll/runs/${id}`);
      return response.data;
    },
    async updatePayrollRun(id: string, data: Record<string, unknown>) {
      const response = await request<PayrollRunRecord>(`/payroll/runs/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return response.data;
    },
    async listPayslips(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<PayslipRecord>>(`/payroll/payslips${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async listPayrollPayments(params?: ListQueryParams | URLSearchParams) {
      const response = await request<PaginatedList<PayrollPaymentRecord>>(`/payroll/payments${toQueryString(params)}`);
      return normalizeListResponse(response);
    },
    async getPayslip(id: string) {
      const response = await request<PayslipRecord>(`/payroll/payslips/${id}`);
      return response.data;
    },
    async markPayslipPaid(id: string, data: Record<string, unknown>) {
      const response = await request<PayslipRecord>(`/payroll/payslips/${id}/mark-paid`, { method: "POST", body: JSON.stringify(data) });
      return response.data;
    },
    async downloadPayslipPdf(id: string) {
      const blob = await downloadFile(`/payroll/payslips/${id}/pdf`, `payslip-${id}.pdf`);
      triggerBrowserDownload(blob, `payslip-${id}.pdf`);
    },
  };
}
