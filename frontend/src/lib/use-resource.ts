"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiError, type ApiError } from "@/lib/api-envelope";

// In-memory SWR resource cache across mount/unmount navigations
const resourceCache = new Map<string, { data: unknown; timestamp: number }>();

export function clearResourceCache(pattern?: string) {
  if (!pattern) {
    resourceCache.clear();
    return;
  }
  for (const k of Array.from(resourceCache.keys())) {
    if (k.includes(pattern)) resourceCache.delete(k);
  }
}

export function seedResourceCache<T>(key: string, data: T) {
  if (key) {
    resourceCache.set(key, { data, timestamp: Date.now() });
  }
}

export function getCachedResource<T>(key: string): T | null {
  if (!key) return null;
  const entry = resourceCache.get(key);
  return entry ? (entry.data as T) : null;
}

/**
 * Load data on mount and whenever `key` changes.
 * Uses in-memory SWR caching: If data is already cached for `key`, it initializes immediately
 * with that data (`loading: false`), rendering instantly with ZERO skeleton flash, and revalidates
 * in the background. Stale responses are safely discarded.
 */
export function useResource<T>(load: () => Promise<T>, key: string = "") {
  const loadRef = useRef(load);
  loadRef.current = load;
  const seq = useRef(0);

  const [state, setState] = useState<{ data: T | null; error: ApiError | null; loading: boolean }>(() => {
    if (key && resourceCache.has(key)) {
      const cached = resourceCache.get(key);
      return {
        data: cached ? (cached.data as T) : null,
        error: null,
        loading: false, // Instant render!
      };
    }
    return {
      data: null,
      error: null,
      loading: true,
    };
  });

  const run = useCallback(async (silent = false) => {
    const id = ++seq.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loadRef.current();
      if (id === seq.current) {
        if (key) {
          resourceCache.set(key, { data, timestamp: Date.now() });
        }
        setState({ data, error: null, loading: false });
      }
    } catch (e) {
      if (id === seq.current) {
        setState((s) => ({ data: s.data, error: getApiError(e), loading: false }));
      }
    }
  }, [key]);

  useEffect(() => {
    // If we have cached data, revalidate silently in the background
    const hasCached = key && resourceCache.has(key);
    void run(Boolean(hasCached));
    const counter = seq;
    return () => {
      counter.current++;
    };
  }, [run, key]);

  return { ...state, reload: run };
}
