export interface ImportError {
  row?: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: ImportError[];
}

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  required?: boolean;
  example?: string | number | null;
}
