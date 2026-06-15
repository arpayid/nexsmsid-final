import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

@Injectable()
export class CaptchaService {
  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.configService.get<string>("TURNSTILE_SECRET_KEY")?.trim());
  }

  async verify(token: string | undefined | null): Promise<void> {
    const secret = this.configService.get<string>("TURNSTILE_SECRET_KEY")?.trim();
    if (!secret) {
      if (this.configService.get<string>("NODE_ENV") === "production") {
        throw new BadRequestException("Verifikasi CAPTCHA belum dikonfigurasi");
      }
      return;
    }

    if (!token?.trim()) {
      throw new BadRequestException("Verifikasi CAPTCHA wajib");
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token.trim(),
      }),
    });

    if (!response.ok) {
      throw new BadRequestException("Verifikasi CAPTCHA gagal");
    }

    const payload = (await response.json()) as TurnstileVerifyResponse;
    if (!payload.success) {
      throw new BadRequestException("Verifikasi CAPTCHA gagal");
    }
  }
}
