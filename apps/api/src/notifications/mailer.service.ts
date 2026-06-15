import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("SMTP_HOST");
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>("SMTP_PORT") ?? 587,
        secure: this.configService.get<string>("SMTP_SECURE") === "true",
        auth: {
          user: this.configService.get<string>("SMTP_USER"),
          pass: this.configService.get<string>("SMTP_PASS"),
        },
      });
      this.logger.log("Mailer initialized with SMTP " + host);
    } else {
      this.logger.warn("SMTP_HOST not set — mailer disabled. Set SMTP_* env vars to enable.");
    }
  }

  async send(payload: EmailPayload) {
    if (!this.transporter) {
      this.logger.warn(`Mailer disabled — skipping email to ${payload.to}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>("SMTP_FROM") ?? "noreply@nexsmsid.dev",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(`Email sent to ${payload.to}: ${payload.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.to}: ${(error as Error).message}`);
    }
  }
}
