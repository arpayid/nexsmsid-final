import { describe, expect, it } from "vitest";

import { safeFileUrlSchema } from "./safe-url";

describe("safeFileUrlSchema", () => {
  it("accepts empty, relative, and https URLs", () => {
    expect(safeFileUrlSchema.parse("")).toBe("");
    expect(safeFileUrlSchema.parse("/uploads/proof.pdf")).toBe("/uploads/proof.pdf");
    expect(safeFileUrlSchema.parse("https://cdn.example.com/proof.pdf")).toBe("https://cdn.example.com/proof.pdf");
  });

  it("rejects javascript and data URLs", () => {
    expect(() => safeFileUrlSchema.parse("javascript:alert(1)")).toThrow();
    expect(() => safeFileUrlSchema.parse("data:text/html,hello")).toThrow();
  });
});
