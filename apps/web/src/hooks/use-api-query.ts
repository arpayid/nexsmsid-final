"use client";

import useSWR from "swr";
import { useCallback, useState } from "react";

type UseApiQueryOptions = {
  enabled?: boolean;
};

export function useApiQuery<T>(queryFn: () => Promise<T>, deps: unknown[] = [], options: UseApiQueryOptions = {}) {
  const { enabled = true } = options;

  // Use JSON.stringify on deps as part of the key for SWR to detect changes
  // We include queryFn.toString() lightly if needed, but since it's an API fetcher,
  // we rely on deps to represent the unique request path/params.
  const key = enabled ? [queryFn.name || "query", ...deps] : null;

  const fetcher = async () => {
    return await queryFn();
  };

  const {
    data,
    error: swrError,
    isLoading: loading,
    mutate,
  } = useSWR<T>(key, fetcher, {
    revalidateOnFocus: false, // Prevents aggressive refetching unless specifically requested
  });

  const [localData, setLocalData] = useState<T | null>(null);

  // Maintain the exact returned API structure for backwards compatibility
  const error = swrError instanceof Error ? swrError.message : swrError ? String(swrError) : null;

  const refetch = useCallback(async () => {
    const result = await mutate();
    return result;
  }, [mutate]);

  // Provide a way to manually overwrite data locally if required by some components
  const setData = useCallback(
    (newData: T | null) => {
      setLocalData(newData);
      if (newData !== null) {
        void mutate(newData, false);
      }
    },
    [mutate],
  );

  const setError = useCallback((newError: string | null) => {
    // Cannot easily set SWR error manually, but backwards compatibility might not strictly need manual errors
  }, []);

  return {
    data: localData !== null ? localData : (data ?? null),
    error,
    loading,
    refetch,
    setData,
    setError,
  };
}
