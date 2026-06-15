import { AuthenticatedUser } from "./auth.types";

export type UserWithAuthRelations = {
  id: string;
  email: string;
  name: string;
  forceChangePassword?: boolean;
  passwordChangedAt?: Date | null;
  roles: Array<{
    role: {
      isActive: boolean;
      slug: string;
      permissions: Array<{
        permission: {
          key: string;
        };
      }>;
    };
  }>;
};

export function toAuthenticatedUser(user: UserWithAuthRelations): AuthenticatedUser {
  const roles = user.roles.filter(({ role }) => role.isActive).map(({ role }) => role.slug);
  const permissions = new Set<string>();

  for (const { role } of user.roles) {
    if (!role.isActive) {
      continue;
    }

    for (const { permission } of role.permissions) {
      permissions.add(permission.key);
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles,
    permissions: [...permissions].sort(),
    forceChangePassword: user.forceChangePassword || false,
    passwordChangedAt: user.passwordChangedAt?.toISOString() ?? undefined,
  };
}
