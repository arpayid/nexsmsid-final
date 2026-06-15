import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { validateSpreadsheetMagicBytes, validatePpdbDocumentMagicBytes } from "./upload";

describe("validateSpreadsheetMagicBytes", () => {
  it("accepts xlsx zip payloads", () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    expect(() => validateSpreadsheetMagicBytes(buffer, "students.xlsx")).not.toThrow();
  });

  it("accepts csv text payloads", () => {
    const buffer = Buffer.from("name,email\nAlice,alice@example.com\n", "utf8");
    expect(() => validateSpreadsheetMagicBytes(buffer, "students.csv")).not.toThrow();
  });

  it("rejects executables disguised as spreadsheets", () => {
    const buffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
    expect(() => validateSpreadsheetMagicBytes(buffer, "students.xlsx")).toThrow(BadRequestException);
  });
});

describe("validatePpdbDocumentMagicBytes", () => {
  it("accepts pdf payloads", () => {
    const buffer = Buffer.from("%PDF-1.4\n", "ascii");
    expect(() => validatePpdbDocumentMagicBytes(buffer, "kk.pdf")).not.toThrow();
  });

  it("accepts jpeg payloads", () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(() => validatePpdbDocumentMagicBytes(buffer, "photo.jpg")).not.toThrow();
  });

  it("rejects executables disguised as pdf", () => {
    const buffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
    expect(() => validatePpdbDocumentMagicBytes(buffer, "kk.pdf")).toThrow(BadRequestException);
  });
});
