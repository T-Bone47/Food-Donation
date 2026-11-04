"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { clearApiCache } from "./api-client";
import { clearResourceCache, seedResourceCache } from "./use-resource";
import type { RealtimeEvent } from "./types";

export type RealtimeStatus = "connected" | "connecting" | "reconnecting" | "offline";

interface RealtimeStore {
  status: RealtimeStatus;
  lastEvent: RealtimeEvent | null;
  lastEventTime: number | null;
  clientCount: number;
}

let activeSource: EventSource | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let currentToken: string | null = null;
let store: RealtimeStore = {
  status: "offline",
  lastEvent: null,
  lastEventTime: null,
  clientCount: 0,
};

const listeners = new Set<() => void>();
const eventHandlers = new Set<(event: RealtimeEvent) => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function updateStore(partial: Partial<RealtimeStore>) {
  store = { ...store, ...partial };
  notify();
}

/**
 * Connect to the SSE endpoint if a valid session token exists.
 */
export function connectRealtime(token?: string) {
  if (typeof window === "undefined") return;

  const resolvedToken = token || localStorage.getItem("authToken");
  if (!resolvedToken) {
    disconnectRealtime();
    return;
  }

  // Already connected with this token
  if (activeSource && currentToken === resolvedToken) {
    return;
  }

  disconnectRealtime();
  currentToken = resolvedToken;
  updateStore({ status: "connecting" });

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const streamUrl = `${apiBase}/api/v1/realtime/stream?token=${encodeURIComponent(resolvedToken)}`;

  try {
    const es = new EventSource(streamUrl);
    activeSource = es;

    es.onopen = () => {
      updateStore({ status: "connected" });
    };

    es.onmessage = (e) => {
      try {
        const payload: RealtimeEvent = JSON.parse(e.data);
        clearApiCache();
        if (payload.type?.startsWith("donation.")) {
          clearResourceCache("donor:stats");
          clearResourceCache("donor:donations:mine");
          clearResourceCache("volunteer:available");
          clearResourceCache("volunteer:stats");
          clearResourceCache("ngo:incoming");
          clearResourceCache("ngo:history");
          clearResourceCache("admin:overview");
          if (payload.data && (payload.data as { id?: string }).id) {
            seedResourceCache(`donation:detail:${(payload.data as { id: string }).id}`, payload.data);
          }
        } else if (payload.type?.startsWith("demo.")) {
          clearResourceCache();
        }

        updateStore({
          lastEvent: payload,
          lastEventTime: Date.now(),
        });

        // Notify all registered event handlers
        for (const handler of eventHandlers) {
          try {
            handler(payload);
          } catch (err) {
            console.error("[REALTIME] Error in event handler:", err);
          }
        }
      } catch {
        // Ping or non-JSON keep-alive
      }
    };

    es.onerror = () => {
      updateStore({ status: "reconnecting" });
      es.close();
      activeSource = null;

      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectRealtime(currentToken || undefined);
        }, 3000);
      }
    };
  } catch (err) {
    console.warn("[REALTIME] Failed to initialize EventSource:", err);
    updateStore({ status: "offline" });
  }
}

/**
 * Disconnect active stream and reset state.
 */
export function disconnectRealtime() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (activeSource) {
    activeSource.close();
    activeSource = null;
  }
  currentToken = null;
  updateStore({ status: "offline" });
}

function subscribeStore(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

const SERVER_SNAPSHOT: RealtimeStore = Object.freeze({
  status: "offline",
  lastEvent: null,
  lastEventTime: null,
  clientCount: 0,
});

function getServerSnapshot(): RealtimeStore {
  return SERVER_SNAPSHOT;
}

function getStoreSnapshot() {
  return store;
}

/**
 * React hook to observe current real-time SSE stream status.
 */
export function useRealtimeStatus(): RealtimeStore {
  return useSyncExternalStore(subscribeStore, getStoreSnapshot, getServerSnapshot);
}

/**
 * React hook to listen for specific real-time events and trigger callbacks (e.g. reload resource).
 * Accepts wildcards (e.g. "donation.*" or ["donation.created", "donation.assigned"]).
 */
export function useRealtimeEvent(
  pattern: string | string[],
  callback: (event: RealtimeEvent) => void
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    const handler = (event: RealtimeEvent) => {
      const eventType = event.type;
      const matches = patterns.some((p) => {
        if (p === "*") return true;
        if (p.endsWith(".*")) {
          const prefix = p.slice(0, -2);
          return eventType.startsWith(prefix);
        }
        return p === eventType;
      });

      if (matches) {
        cbRef.current(event);
      }
    };

    eventHandlers.add(handler);
    return () => {
      eventHandlers.delete(handler);
    };
  }, [pattern]);
}
