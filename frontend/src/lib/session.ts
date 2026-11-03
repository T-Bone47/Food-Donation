"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api-client";
import type { UserRole } from "@/lib/types";

/** The user object the login/signup pages already store in localStorage under "user". */
export interface StoredUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  phonenumber?: string;
  organization?: string;
  isDemo?: boolean;
}

const ROLES: Record<string, UserRole> = { donor: "Donor", volunteer: "Volunteer", ngo: "NGO", admin: "Admin" };

export function normalizeRole(role?: string | null): UserRole | null {
  return role ? (ROLES[role.trim().toLowerCase()] ?? null) : null;
}

/** Same destinations the login page redirects to. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  Donor: "/donordash",
  Volunteer: "/volunteerdash",
  NGO: "/ngodash",
  Admin: "/adminpage",
};

export const USER_CHANGED_EVENT = "foodshare:user-changed";

// In-memory cached session to eliminate 1-tick delay and skeleton flickers during client navigation
let memoryUser: StoredUser | null = null;
let memoryReady = false;

function readStorageUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as StoredUser | null) : null;
  } catch {
    return null;
  }
}

/** Reads the stored user with instant in-memory fallback for client transitions. */
export function useCurrentUser() {
  const [state, setState] = useState<{ user: StoredUser | null; ready: boolean }>(() => {
    if (typeof window !== "undefined") {
      if (!memoryReady) {
        memoryUser = readStorageUser();
        memoryReady = true;
      }
      return { user: memoryUser, ready: true };
    }
    return { user: null, ready: false };
  });

  useEffect(() => {
    const sync = () => {
      memoryUser = readStorageUser();
      memoryReady = true;
      setState({ user: memoryUser, ready: true });
    };

    // Synchronize if mounted during SSR transition
    sync();

    // Same-tab edits (e.g. saving the profile, switching roles) announce themselves so nav updates
    window.addEventListener(USER_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(USER_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}

/** Same behaviour as the old navbars: revoke server-side if reachable, always clear local and memory state. */
export async function signOut(): Promise<void> {
  memoryUser = null;
  memoryReady = false;
  try {
    await authApi.logout();
  } catch {
    // Offline or already expired: local state is still cleared below.
  } finally {
    for (const key of ["authToken", "user", "token", "userEmail"]) localStorage.removeItem(key);
    window.dispatchEvent(new Event(USER_CHANGED_EVENT));
  }
}
