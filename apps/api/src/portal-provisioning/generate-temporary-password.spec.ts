import { describe, expect, it } from "vitest";

import { generateTemporaryPassword } from "./generate-temporary-password";

describe("generateTemporaryPassword", () => {
  it("generates passwords that satisfy the portal policy", () => {
    const password = generateTemporaryPassword();
    expect(password.length).toBeGreaterThanOrEqual(12);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
    expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
  });
});
