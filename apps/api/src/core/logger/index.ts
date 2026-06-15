import { Injectable, Logger as NestLogger } from "@nestjs/common";

@Injectable()
export class AppLogger extends NestLogger {
  constructor(context: string) {
    super(context);
  }

  static create(context: string): AppLogger {
    return new AppLogger(context);
  }
}
