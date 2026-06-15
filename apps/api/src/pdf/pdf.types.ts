export interface PdfHeader {
  schoolName: string;
  schoolAddress?: string | null;
  schoolPhone?: string | null;
  schoolEmail?: string | null;
  title: string;
  documentNumber?: string | null;
  printedAt?: Date;
}

export interface PdfKeyValue {
  label: string;
  value?: string | number | null;
}

export interface PdfTableColumn {
  header: string;
  width: number;
  align?: "left" | "right" | "center";
}

export interface PdfTableRow {
  cells: Array<{ text: string | number; align?: "left" | "right" | "center" }>;
}

export interface PdfDocumentResult {
  buffer: Buffer;
  filename: string;
  inline?: boolean;
}
