"use client";

import { useEffect, useState } from "react";

import type { AuthUser } from "@nexsmsid/api-client";

import { createBrowserApiClient } from "@/lib/api-client";
import { getStoredUser, storeUser } from "@/lib/auth-storage";

function hasPermission(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.permissions.includes("*")) return true;
  return user.permissions.includes(permission);
}

export function useRequirePermission(permission: string, authUser?: AuthUser | null) {
  const isControlled = authUser !== undefined;
  const [fetchedUser, setFetchedUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(!isControlled);

  useEffect(() => {
    if (isControlled) {
      return;
    }

    let active = true;

    async function loadUser() {
      setLoading(true);

      try {
        const currentUser = await createBrowserApiClient().me();
        storeUser(currentUser);
        if (active) {
          setFetchedUser(currentUser);
        }
      } catch {
        if (active) {
          setFetchedUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [isControlled, permission]);

  const user = isControlled ? authUser : fetchedUser;
  const allowed = hasPermission(user, permission);

  return { user, loading: isControlled ? false : loading, allowed };
}
