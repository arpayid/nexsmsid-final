import { ReportDataResult } from "./report-engine.types";

export type ReportFilters = Record<string, unknown>;

export function filterString(filters: ReportFilters, key: string): string | undefined {
  const value = filters[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

export function filterNumber(filters: ReportFilters, key: string): number | undefined {
  const value = filters[key];
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function filterDate(filters: ReportFilters, key: string): Date {
  const value = filters[key];
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return new Date(Number(value));
  return new Date(String(value));
}

export function hasFilter(filters: ReportFilters, key: string): boolean {
  const value = filters[key];
  return value !== undefined && value !== null && value !== "";
}

export function formatReportDate(value: Date | string | null | undefined): string {
  return value ? new Date(value).toISOString().split("T")[0] : "-";
}

export function formatReportCurrency(value: unknown): string {
  return Number(value ?? 0).toLocaleString("id-ID");
}

export interface ReportProvider {
  getData(reportCode: string, filters: ReportFilters): Promise<ReportDataResult>;
  supportedReports(): string[];
}
