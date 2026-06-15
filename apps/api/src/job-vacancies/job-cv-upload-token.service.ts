import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

export type JobCvUploadTokenPayload = {
  purpose: "job-cv-upload";
  jobVacancyId: string;
};

@Injectable()
export class JobCvUploadTokenService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  issue(jobVacancyId: string): string {
    return this.jwtService.sign({ purpose: "job-cv-upload", jobVacancyId } satisfies JobCvUploadTokenPayload, {
      secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: "15m",
    });
  }

  verify(token: string): JobCvUploadTokenPayload {
    try {
      const payload = this.jwtService.verify<JobCvUploadTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
      if (payload.purpose !== "job-cv-upload" || !payload.jobVacancyId) {
        throw new UnauthorizedException("Token unggah tidak valid");
      }
      return payload;
    } catch {
      throw new UnauthorizedException("Token unggah tidak valid atau sudah kedaluwarsa");
    }
  }
}
