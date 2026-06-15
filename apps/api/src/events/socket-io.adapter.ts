import type { INestApplicationContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import type { ServerOptions } from "socket.io";

export class SocketIoCorsAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const origins = this.configService
      .getOrThrow<string>("WEB_ORIGIN")
      .split(",")
      .map((origin) => origin.trim());

    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: origins,
        credentials: true,
      },
    });
  }
}
