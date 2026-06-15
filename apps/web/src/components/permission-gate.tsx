"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import type { AuthUser } from "@nexsmsid/api-client";
import { ErrorState } from "@nexsmsid/ui";

import { useRequirePermission } from "@/hooks/use-require-permission";

type PermissionGateProps = {
  authUser?: AuthUser | null;
  children: ReactNode;
  fallback?: ReactNode;
  permission: string;
};

export function PermissionGate({ authUser, children, fallback, permission }: PermissionGateProps) {
  const { loading, allowed } = useRequirePermission(permission, authUser);

  if (loading) {
    return (
      <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-surface-muted text-sm font-bold text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Memeriksa izin akses...
        </span>
      </div>
    );
  }

  if (!allowed) {
    return fallback ?? <ErrorState message="Anda tidak memiliki izin untuk mengakses halaman ini." title="Akses ditolak" />;
  }

  return children;
}
