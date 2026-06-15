"use client";

import { useCallback, useEffect, useState } from "react";

type UseApiQueryOptions = {
  enabled?: boolean;
};

export function useApiQuery<T>(queryFn: () => Promise<T>, deps: unknown[] = [], options: UseApiQueryOptions = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(enabled);
  const loading = enabled && fetchLoading;

  const refetch = useCallback(async () => {
    setFetchLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      return null;
    } finally {
      setFetchLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    async function load() {
      setFetchLoading(true);
      setError(null);

      try {
        const result = await queryFn();
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        if (active) setFetchLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, queryFn, ...deps]);

  return { data, error, loading, refetch, setData, setError };
}
