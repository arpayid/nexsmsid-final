import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";

import { AuthTokenPair, clearAuthCookies, sanitizeAuthPayload, setAuthCookies } from "./auth-cookies";

@Injectable()
export class AuthCookieService {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  attachAuthCookies(res: Response, tokens: AuthTokenPair) {
    const nodeEnv = this.configService.getOrThrow<string>("NODE_ENV");
    const webOrigin = this.configService.getOrThrow<string>("WEB_ORIGIN");
    const refreshTtl = this.parseExpiresIn(this.configService.getOrThrow<string>("JWT_REFRESH_EXPIRES_IN"));
    setAuthCookies(res, tokens, refreshTtl, nodeEnv, webOrigin);
  }

  clearAuthCookies(res: Response) {
    const nodeEnv = this.configService.getOrThrow<string>("NODE_ENV");
    const webOrigin = this.configService.getOrThrow<string>("WEB_ORIGIN");
    clearAuthCookies(res, nodeEnv, webOrigin);
  }

  sanitizeAuthResponse<T extends AuthTokenPair & { user: unknown; tokenType?: string }>(payload: T) {
    return sanitizeAuthPayload(payload, this.configService.getOrThrow<string>("NODE_ENV"));
  }

  private parseExpiresIn(value: string): number {
    const match = /^(\d+)([smhd])$/i.exec(value.trim());
    if (!match) return 7 * 24 * 60 * 60;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "s") return amount;
    if (unit === "m") return amount * 60;
    if (unit === "h") return amount * 60 * 60;
    return amount * 24 * 60 * 60;
  }
}
