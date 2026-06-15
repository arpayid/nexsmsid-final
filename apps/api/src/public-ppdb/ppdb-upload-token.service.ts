import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

export type PpdbUploadTokenPayload = {
  purpose: "ppdb-upload";
  registrationId: string;
  registrationNumber: string;
  phone: string;
};

@Injectable()
export class PpdbUploadTokenService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  issue(registrationId: string, registrationNumber: string, phone: string): string {
    return this.jwtService.sign({ purpose: "ppdb-upload", registrationId, registrationNumber, phone } satisfies PpdbUploadTokenPayload, {
      secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: "30m",
    });
  }

  verify(token: string): PpdbUploadTokenPayload {
    try {
      const payload = this.jwtService.verify<PpdbUploadTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
      if (payload.purpose !== "ppdb-upload" || !payload.registrationId) {
        throw new UnauthorizedException("Token unggah tidak valid");
      }
      return payload;
    } catch {
      throw new UnauthorizedException("Token unggah tidak valid atau sudah kedaluwarsa");
    }
  }
}
