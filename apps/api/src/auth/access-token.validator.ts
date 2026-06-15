import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import { AuthenticatedUser, JwtAccessPayload } from "./auth.types";
import { toAuthenticatedUser } from "./auth-user.mapper";

type ValidateAccessTokenOptions = {
  allowPendingPasswordChange?: boolean;
  softFail?: boolean;
};

export async function resolveAuthenticatedUserFromAccessPayload(
  prisma: PrismaService,
  payload: JwtAccessPayload,
  options: ValidateAccessTokenOptions = {},
): Promise<AuthenticatedUser | null> {
  const reject = (error: UnauthorizedException | ForbiddenException) => {
    if (options.softFail) return null;
    throw error;
  };

  if (payload.type !== "access" || !payload.sub) {
    return reject(new UnauthorizedException("Invalid token type"));
  }

  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
      deletedAt: null,
      status: "ACTIVE",
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return reject(new UnauthorizedException("User is not active"));
  }

  if (user.passwordChangedAt) {
    if (!payload.passwordChangedAt || new Date(payload.passwordChangedAt).getTime() !== user.passwordChangedAt.getTime()) {
      return reject(new UnauthorizedException("Token has been invalidated. Please login again."));
    }
  }

  if (user.forceChangePassword && !options.allowPendingPasswordChange) {
    return reject(new ForbiddenException("Password change required. Please change your password before continuing."));
  }

  return toAuthenticatedUser(user);
}
