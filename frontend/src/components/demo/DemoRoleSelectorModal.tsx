"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Soup,
  Truck,
  Building,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearApiCache, demoApi } from "@/lib/api-client";
import { clearResourceCache } from "@/lib/use-resource";
import { getApiError, errorMessages } from "@/lib/api-envelope";
import { HOME_BY_ROLE, normalizeRole, USER_CHANGED_EVENT } from "@/lib/session";
import type { UserRole } from "@/lib/types";

export interface DemoRoleCard {
  role: "donor" | "volunteer" | "ngo" | "admin";
  title: string;
  roleEnum: UserRole;
  displayName: string;
  badge: string;
  description: string;
  icon: typeof Soup;
  colorScheme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    iconText: string;
  };
}

const DEMO_CARDS: DemoRoleCard[] = [
  {
    role: "donor",
    title: "Donor Demo",
    roleEnum: "Donor",
    displayName: "Demo Food Donor",
    badge: "Food Creator",
    description: "Explore surplus food listings, create donations and track donation progress.",
    icon: Soup,
    colorScheme: {
      bg: "hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-800/40",
      badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
      badgeText: "text-emerald-700",
      iconBg: "bg-emerald-600 text-white",
      iconText: "text-emerald-600",
    },
  },
  {
    role: "volunteer",
    title: "Volunteer Demo",
    roleEnum: "Volunteer",
    displayName: "Demo Volunteer",
    badge: "Field Rescue",
    description: "Explore available donations, claim pickup tasks and complete deliveries.",
    icon: Truck,
    colorScheme: {
      bg: "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-800/40",
      badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
      badgeText: "text-blue-700",
      iconBg: "bg-blue-600 text-white",
      iconText: "text-blue-600",
    },
  },
  {
    role: "ngo",
    title: "NGO Demo",
    roleEnum: "NGO",
    displayName: "Demo NGO",
    badge: "Shelter & Intake",
    description: "Explore incoming donations, delivery tracking and receipt confirmation.",
    icon: Building,
    colorScheme: {
      bg: "hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-800/40",
      badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
      badgeText: "text-amber-700",
      iconBg: "bg-amber-600 text-white",
      iconText: "text-amber-600",
    },
  },
  {
    role: "admin",
    title: "Platform Admin Demo",
    roleEnum: "Admin",
    displayName: "Demo Administrator",
    badge: "Governance",
    description: "Inspect platform overview, manage users, review verifications and monitor activities.",
    icon: ShieldCheck,
    colorScheme: {
      bg: "hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20",
      border: "border-purple-200 dark:border-purple-800/40",
      badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300",
      badgeText: "text-purple-700",
      iconBg: "bg-purple-600 text-white",
      iconText: "text-purple-600",
    },
  },
];

export default function DemoRoleSelectorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Proactively prefetch all role destination routes on modal open
  useEffect(() => {
    if (isOpen) {
      router.prefetch("/donordash");
      router.prefetch("/volunteerdash");
      router.prefetch("/ngodash");
      router.prefetch("/adminpage");
    }
  }, [isOpen, router]);

  if (!isOpen) return null;

  async function handleSelectRole(role: "donor" | "volunteer" | "ngo" | "admin") {
    setLoadingRole(role);
    setErrorMsg(null);

    try {
      // 1. Clear previous session & in-memory caches
      for (const k of ["authToken", "user", "token", "userEmail"]) {
        localStorage.removeItem(k);
      }
      clearApiCache();
      clearResourceCache();

      // 2. Request authenticated demo session from server
      const res = await demoApi.createSession(role);
      const { user, token, isDemo } = res.data;

      // 3. Store demo session
      localStorage.setItem("authToken", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          isDemo: isDemo ?? true,
        })
      );

      // 4. Notify app components of user change
      window.dispatchEvent(new Event(USER_CHANGED_EVENT));

      // 5. Navigate to role dashboard
      const normalized = normalizeRole(user.role);
      const destination = normalized ? HOME_BY_ROLE[normalized] : "/";
      onClose();
      router.push(destination);
    } catch (err) {
      const errObj = getApiError(err);
      const msgs = errorMessages(errObj);
      setErrorMsg(msgs.length > 0 ? msgs[0] : "Failed to establish demo session. Please try again.");
      setLoadingRole(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150 backdrop-blur-xs"
    >
      <div data-ui="modal" className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 id="demo-modal-title" className="text-xl font-bold tracking-tight text-foreground">
                Explore Interactive Demo
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch instantly between roles with isolated demo state and live telemetry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loadingRole !== null}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close demo modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loadingRole && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary font-medium ">
              <Loader2 className="size-4 animate-spin shrink-0" />
              <span>Establishing authenticated {loadingRole.toUpperCase()} session and pre-warming workspace…</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {DEMO_CARDS.map((card) => {
              const Icon = card.icon;
              const isLoading = loadingRole === card.role;
              const isOtherLoading = loadingRole !== null && !isLoading;

              return (
                <div
                  key={card.role}
                  role="button"
                  tabIndex={isOtherLoading ? -1 : 0}
                  onClick={() => !isOtherLoading && handleSelectRole(card.role)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !isOtherLoading) {
                      e.preventDefault();
                      handleSelectRole(card.role);
                    }
                  }}
                  onMouseEnter={() => router.prefetch(HOME_BY_ROLE[card.roleEnum])}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-100 active:scale-[0.98] cursor-pointer select-none ${card.colorScheme.border} ${card.colorScheme.bg} ${
                    isOtherLoading ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid size-9 place-items-center rounded-lg ${card.colorScheme.iconBg}`}>
                          <Icon className="size-4.5" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-foreground">{card.title}</h3>
                          <p className="text-xs text-muted-foreground">{card.displayName}</p>
                        </div>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${card.colorScheme.badgeBg}`}>
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full justify-between pointer-events-none"
                      loading={isLoading}
                      disabled={isOtherLoading}
                    >
                      <span>Enter {card.roleEnum} Demo</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span>
                <strong>Data Isolation Guarantee:</strong> Demo mode operations are isolated from production databases and can be reset at any time.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
