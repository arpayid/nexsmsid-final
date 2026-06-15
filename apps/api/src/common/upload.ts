import { BadRequestException } from "@nestjs/common";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const ALLOWED_MIMETYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  // Some browsers send octet-stream for spreadsheets; extension + magic-byte checks are the effective gates
  "application/octet-stream",
]);

function isZipSpreadsheet(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);
}

function isOleSpreadsheet(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  );
}

function isTextCsv(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  if (sample.includes(0x00)) return false;
  try {
    const text = sample.toString("utf8");
    return text.length > 0 && !text.includes("\uFFFD");
  } catch {
    return false;
  }
}

/** Reject disguised binaries: verify file content matches an allowed spreadsheet format. */
export function validateSpreadsheetMagicBytes(buffer: Buffer, originalname?: string): void {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException("Empty file");
  }

  const name = (originalname ?? "").toLowerCase();
  const extension = ALLOWED_EXTENSIONS.find((candidate) => name.endsWith(candidate));

  if (extension === ".xlsx" && isZipSpreadsheet(buffer)) return;
  if (extension === ".xls" && isOleSpreadsheet(buffer)) return;
  if (extension === ".csv" && isTextCsv(buffer)) return;

  // Extension-agnostic fallback when the client omits or mislabels the filename.
  if (isZipSpreadsheet(buffer) || isOleSpreadsheet(buffer) || isTextCsv(buffer)) return;

  throw new BadRequestException("File content does not match an allowed Excel/CSV format");
}

/** Shared Multer options for Excel/CSV import endpoints: size cap + type allowlist. */
export const excelFileInterceptorOptions: MulterOptions = {
  limits: { fileSize: MAX_EXCEL_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname ?? "").toLowerCase();
    const extensionAllowed = ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension));

    if (!extensionAllowed || !ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(new BadRequestException("Only Excel/CSV files (.xlsx, .xls, .csv) are allowed"), false);
      return;
    }

    cb(null, true);
  },
};

const MAX_PPDB_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5 MB
const PPDB_ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const PPDB_ALLOWED_MIMETYPES = new Set(["application/pdf", "image/jpeg", "image/png", "application/octet-stream"]);

function isPdfDocument(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function isJpegImage(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPngImage(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

/** Reject disguised binaries: verify PPDB document content matches PDF or image format. */
export function validatePpdbDocumentMagicBytes(buffer: Buffer, originalname?: string): void {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException("Empty file");
  }

  const name = (originalname ?? "").toLowerCase();
  const extension = PPDB_ALLOWED_EXTENSIONS.find((candidate) => name.endsWith(candidate));

  if (extension === ".pdf" && isPdfDocument(buffer)) return;
  if ((extension === ".jpg" || extension === ".jpeg") && isJpegImage(buffer)) return;
  if (extension === ".png" && isPngImage(buffer)) return;

  if (isPdfDocument(buffer) || isJpegImage(buffer) || isPngImage(buffer)) return;

  throw new BadRequestException("File content does not match an allowed PDF or image format");
}

/** Multer options for PPDB document uploads (PDF / image). */
export const ppdbDocumentFileInterceptorOptions: MulterOptions = {
  limits: { fileSize: MAX_PPDB_DOCUMENT_SIZE },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname ?? "").toLowerCase();
    const extensionAllowed = PPDB_ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension));

    if (!extensionAllowed || !PPDB_ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(new BadRequestException("Only PDF or image files (.pdf, .jpg, .jpeg, .png) are allowed"), false);
      return;
    }

    cb(null, true);
  },
};
