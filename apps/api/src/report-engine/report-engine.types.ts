export enum ReportCategory {
  ACADEMIC = "Academic",
  FINANCE = "Finance",
  PPDB = "PPDB",
  PKL_BKK = "PKL/BKK",
  COMMUNICATION = "Communication",
  BK_DISCIPLINE = "BK & Discipline",
  LETTERS = "Letters",
  INVENTORY = "Inventory",
  LIBRARY = "Library",
  HR = "HR",
  PAYROLL = "Payroll",
}

export interface ReportFilterDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean";
  required?: boolean;
  options?: { label: string; value: string }[];
  reference?: string; // e.g. 'AcademicYear', 'Classroom'
}

export interface ReportDefinition {
  code: string;
  name: string;
  category: ReportCategory;
  supportedFormats: ("XLSX" | "PDF" | "CSV" | "JSON")[];
  requiredFilters: string[];
  optionalFilters: string[];
  permissions: string[];
}

export interface ReportDataResult {
  columns: { key: string; label: string; width?: number }[];
  rows: any[];
  title: string;
  subtitle?: string;
}
