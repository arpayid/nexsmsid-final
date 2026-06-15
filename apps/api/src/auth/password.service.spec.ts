import { describe, it, expect } from "vitest";
import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("should hash a password", async () => {
    const hash = await service.hash("TestPassword123!");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("TestPassword123!");
    expect(hash.startsWith("$2a$")).toBe(true);
  });

  it("should verify correct password", async () => {
    const password = "TestPassword123!";
    const hash = await service.hash(password);
    const result = await service.verify(password, hash);
    expect(result).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const hash = await service.hash("TestPassword123!");
    const result = await service.verify("WrongPassword456!", hash);
    expect(result).toBe(false);
  });

  it("should produce different hashes for same password", async () => {
    const password = "TestPassword123!";
    const hash1 = await service.hash(password);
    const hash2 = await service.hash(password);
    expect(hash1).not.toBe(hash2);
  });

  it("should hash with cost factor 12", async () => {
    const hash = await service.hash("TestPassword123!");
    expect(hash.startsWith("$2a$12$")).toBe(true);
  });
});
