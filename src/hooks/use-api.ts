"use client";

import { useState, useCallback } from "react";

interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  execute: (...args: unknown[]) => Promise<T | null>;
}

/** Generic hook for API calls with loading/error state */
export function useApi<T>(
  fn: (...args: unknown[]) => Promise<Response>
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args: unknown[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fn(...args);
        const json = await res.json();
        if (!json.success) {
          setError(json.error || "Something went wrong");
          return null;
        }
        setData(json.data);
        return json.data as T;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { data, error, loading, execute };
}

/** Simple fetch wrapper */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
}
