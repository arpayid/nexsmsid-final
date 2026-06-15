import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type WhatsAppPayload = {
  to: string;
  message: string;
};

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiKey: string | null;
  private readonly apiUrl: string;
  private readonly enabled: boolean;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("WA_API_KEY") ?? null;
    this.apiUrl = this.configService.get<string>("WA_API_URL") ?? "https://api.fonnte.com/send";
    this.enabled = !!this.apiKey;

    if (this.enabled) {
      this.logger.log("WhatsApp service initialized");
    } else {
      this.logger.warn("WA_API_KEY not set — WhatsApp disabled. Set WA_API_KEY to enable.");
    }
  }

  async send(payload: WhatsAppPayload) {
    if (!this.enabled) {
      this.logger.warn(`WhatsApp disabled — skipping message to ${payload.to}`);
      return { success: false, reason: "WhatsApp not configured" };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.apiKey!,
        },
        body: JSON.stringify({
          target: payload.to,
          message: payload.message,
          countryCode: "62",
        }),
      });

      const result = await response.json();
      this.logger.log(`WhatsApp sent to ${payload.to}: ${result.status || "OK"}`);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`WhatsApp failed to ${payload.to}: ${(error as Error).message}`);
      return { success: false, reason: (error as Error).message };
    }
  }

  async sendNotification(userPhone: string, title: string, body: string) {
    const message = `*${title}*\n\n${body}\n\n— NexSMSID`;
    return this.send({ to: userPhone, message });
  }
}
