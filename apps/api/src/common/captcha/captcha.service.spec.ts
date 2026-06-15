import { ConfigService } from "@nestjs/config";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CaptchaService } from "./captcha.service";

describe("CaptchaService", () => {
  let service: CaptchaService;
  let config: Record<string, string | undefined>;

  beforeEach(() => {
    config = { NODE_ENV: "test" };
    service = new CaptchaService({
      get: (key: string) => config[key],
    } as ConfigService);
  });

  it("skips verification when secret is not configured in non-production", async () => {
    await expect(service.verify(undefined)).resolves.toBeUndefined();
  });

  it("requires token when secret is configured", async () => {
    config.TURNSTILE_SECRET_KEY = "test-secret";
    await expect(service.verify(undefined)).rejects.toThrow("Verifikasi CAPTCHA wajib");
  });

  it("verifies token with Turnstile API", async () => {
    config.TURNSTILE_SECRET_KEY = "test-secret";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await service.verify("token-123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
    fetchMock.mockRestore();
  });
});
