import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";

import { PrismaService } from "../../database/prisma.service";
import { JwtAccessPayload, RequestWithUser } from "../auth.types";
import { readAccessTokenFromRequest } from "../auth-cookies";
import { resolveAuthenticatedUserFromAccessPayload } from "../access-token.validator";
import { ALLOW_PENDING_PASSWORD_CHANGE_KEY } from "../decorators/allow-pending-password-change.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = readAccessTokenFromRequest(request.cookies ?? {}, request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    let payload: JwtAccessPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    const allowPendingPasswordChange = this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD_CHANGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const user = await resolveAuthenticatedUserFromAccessPayload(this.prisma, payload, { allowPendingPasswordChange });
    request.user = user!;
    return true;
  }
}
