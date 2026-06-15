import { CanActivate, ExecutionContext, Inject, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RequestWithUser } from "../auth.types";
import { ALLOW_AUTHENTICATED_KEY } from "../decorators/allow-authenticated.decorator";
import { REQUIRED_PERMISSIONS_KEY } from "../decorators/require-permissions.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const allowAuthenticated = this.reflector.getAllAndOverride<boolean>(ALLOW_AUTHENTICATED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowAuthenticated) {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      if (!request.user) {
        throw new ForbiddenException("You do not have permission to access this resource");
      }
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) {
      throw new ForbiddenException("This endpoint requires explicit permissions");
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("You do not have permission to access this resource");
    }

    const hasPermission = requiredPermissions.every((permission) => user.permissions.some((p) => p === permission || p === "*"));

    if (!hasPermission) {
      throw new ForbiddenException("You do not have permission to access this resource");
    }

    return true;
  }
}
