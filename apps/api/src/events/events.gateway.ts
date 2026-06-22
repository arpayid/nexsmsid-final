import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { parse as parseCookie } from "cookie";
import { Namespace, Server, Socket } from "socket.io";

import { JwtAccessPayload } from "../auth/auth.types";
import { AUTH_ACCESS_COOKIE } from "../auth/auth-cookies";
import { resolveAuthenticatedUserFromAccessPayload } from "../auth/access-token.validator";
import { PrismaService } from "../database/prisma.service";

@WebSocketGateway({
  namespace: "/events",
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, Set<string>>();
  private ipConnections = new Map<string, Set<string>>();
  private static readonly MAX_CONNECTIONS_PER_IP = 5;

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server | Namespace) {
    const origins = this.configService
      .getOrThrow<string>("WEB_ORIGIN")
      .split(",")
      .map((origin) => origin.trim());

    // Belt-and-suspenders: ensure engine CORS matches WEB_ORIGIN even if adapter options were overridden.
    const rootServer: Server = "engine" in server && server.engine != null ? server : (server as Namespace).server;
    const engine = rootServer.engine as { opts?: { cors?: { origin: string[]; credentials: boolean } } } | undefined;
    if (engine?.opts) {
      engine.opts.cors = {
        origin: origins,
        credentials: true,
      };
    }
  }

  async handleConnection(client: Socket) {
    const ip = client.handshake.address;
    if (ip) {
      if (!this.ipConnections.has(ip)) {
        this.ipConnections.set(ip, new Set());
      }
      const ipSockets = this.ipConnections.get(ip)!;
      if (ipSockets.size >= EventsGateway.MAX_CONNECTIONS_PER_IP) {
        this.logger.warn(`Client ${client.id} rejected: IP ${ip} exceeds ${EventsGateway.MAX_CONNECTIONS_PER_IP} concurrent connections`);
        client.disconnect(true);
        return;
      }
      ipSockets.add(client.id);
    }

    const userId = await this.authenticate(client);

    if (!userId) {
      this.logger.warn(`Client ${client.id} rejected: missing or invalid access token`);
      this.cleanupIp(client);
      client.disconnect(true);
      return;
    }

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    client.join(`user:${userId}`);

    this.logger.log(`Client connected: ${client.id} (user:${userId})`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.delete(client.id) && sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.cleanupIp(client);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private cleanupIp(client: Socket) {
    const ip = client.handshake.address;
    if (!ip) return;
    const ipSockets = this.ipConnections.get(ip);
    if (!ipSockets) return;
    ipSockets.delete(client.id);
    if (ipSockets.size === 0) {
      this.ipConnections.delete(ip);
    }
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToAll(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  private async authenticate(client: Socket): Promise<string | null> {
    const token = this.extractToken(client);
    if (!token) return null;

    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
      const user = await resolveAuthenticatedUserFromAccessPayload(this.prisma, payload, { softFail: true });
      return user?.id ?? null;
    } catch {
      this.logger.warn(`Client ${client.id} token verification failed`);
      return null;
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth as Record<string, unknown> | undefined)?.token;
    if (typeof authToken === "string" && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, "");
    }

    const cookieHeader = client.handshake.headers.cookie;
    if (typeof cookieHeader === "string") {
      const cookies = parseCookie(cookieHeader);
      const cookieToken = cookies[AUTH_ACCESS_COOKIE];
      if (cookieToken) return cookieToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice("Bearer ".length).trim();
    }

    return null;
  }
}
