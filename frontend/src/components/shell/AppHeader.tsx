"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  Menu,
  Search,
  Sparkles,
} from "lucide-react";

import { normalizeRole, useCurrentUser } from "@/lib/session";
import { connectRealtime, useRealtimeStatus } from "@/lib/realtime";
import { useEffect, useState } from "react";

const SECTION_MAP: Record<string, { parent: string; current: string }> = {
  "/adminpage": { parent: "Admin", current: "Operations & Governance" },
  "/admin": { parent: "Admin", current: "Operations & Governance" },
  "/donordash": { parent: "Donor", current: "Donation Operations" },
  "/donate": { parent: "Donor", current: "Create Donation" },
  "/mydonations": { parent: "Donor", current: "My Donations" },
  "/volunteerdash": { parent: "Volunteer", current: "Available Donations" },
  "/volunteer/tasks": { parent: "Volunteer", current: "My Tasks" },
  "/ngodash": { parent: "Community", current: "Receiving Hub" },
  "/notification": { parent: "Account", current: "Notifications" },
  "/profile": { parent: "Account", current: "Profile & Settings" },
};

export default function AppHeader({
  onOpenMobile,
  onOpenDemoSelector,
  onOpenGuidedDemo,
}: {
  onOpenMobile: () => void;
  onOpenDemoSelector: () => void;
  onOpenGuidedDemo: () => void;
}) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const role = normalizeRole(user?.role) || "Donor";
  const realtime = useRealtimeStatus();
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    connectRealtime();
    const updateUrl = () => {
      if (typeof window !== "undefined") {
        setCurrentUrl(window.location.search + window.location.hash);
      }
    };
    updateUrl();
    window.addEventListener("popstate", updateUrl);
    window.addEventListener("hashchange", updateUrl);
    return () => {
      window.removeEventListener("popstate", updateUrl);
      window.removeEventListener("hashchange", updateUrl);
    };
  }, [pathname]);

  const baseBreadcrumb = SECTION_MAP[pathname] || {
    parent: "Platform",
    current: pathname.replace("/", "").replace(/-/g, " ") || "Dashboard",
  };

  let resolvedCurrent = baseBreadcrumb.current;
  if (pathname === "/ngodash") {
    if (currentUrl.includes("incoming") || currentUrl.includes("awaiting")) {
      resolvedCurrent = "Incoming Deliveries";
    } else if (currentUrl.includes("history") || currentUrl.includes("completed")) {
      resolvedCurrent = "Received History";
    } else if (currentUrl.includes("verification")) {
      resolvedCurrent = "Facility Profile";
    } else {
      resolvedCurrent = "Receiving Hub";
    }
  } else if (pathname === "/adminpage") {
    if (currentUrl.includes("donations")) {
      resolvedCurrent = "Donations Management";
    } else if (currentUrl.includes("verifications")) {
      resolvedCurrent = "NGO Verifications";
    } else if (currentUrl.includes("activity")) {
      resolvedCurrent = "Audit Logs";
    } else if (currentUrl.includes("users")) {
      resolvedCurrent = "Users & NGOs Directory";
    } else {
      resolvedCurrent = "Operations & Governance";
    }
  }

  const breadcrumbs = { parent: baseBreadcrumb.parent, current: resolvedCurrent };

  const handleOpenChatbot = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("foodshare:open-chatbot"));
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-card/90 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
      {/* Left: Mobile Toggle & Workspace Breadcrumbs & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="grid size-9 place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-container lg:hidden shrink-0"
          aria-label="Open navigation sidebar"
        >
          <Menu className="size-5" />
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted shrink-0 font-sans">
          <span className="hover:text-ink transition-colors cursor-pointer">{breadcrumbs.parent}</span>
          <span>/</span>
          <span className="font-semibold text-ink">{breadcrumbs.current}</span>
        </div>

        {/* Global Search Bar (⌘K) matching Stitch */}
        <div className="relative max-w-sm w-full hidden md:block ml-2">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-ink-muted">
            <Search className="size-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search donations, batch IDs, NGOs... ⌘K"
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-border/60 rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-card focus:border-primary/50 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right: Network status + Logistics AI trigger + Notification bell + User profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-sans">
        {/* Network Status Indicator */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low border border-border/60 rounded-full text-xs text-ink-muted font-sans"
          title={`Realtime SSE connection: ${realtime.status}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              realtime.status === "connected"
                ? "bg-emerald-500"
                : realtime.status === "connecting" || realtime.status === "reconnecting"
                ? "bg-amber-500"
                : "bg-stone-400"
            }`}
          />
          <span>
            {realtime.status === "connected"
              ? "Live Network"
              : realtime.status === "reconnecting"
              ? "Reconnecting"
              : "Standby"}
          </span>
        </div>

        {/* Logistics AI Chatbot Trigger Button matching Stitch */}
        <button
          type="button"
          onClick={handleOpenChatbot}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-leaf-700 hover:bg-leaf-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          title="Open AI Logistics Assistant"
        >
          <Bot className="size-3.5 text-tertiary-fixed" />
          <span className="hidden sm:inline">Logistics AI</span>
        </button>

        {/* Guided Demo Pill */}
        <button
          type="button"
          onClick={onOpenGuidedDemo}
          className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border/70 bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-container transition-colors"
        >
          <Sparkles className="size-3 text-amber-500" />
          <span>Demo Guide</span>
        </button>

        {/* Notifications Icon Button */}
        <Link
          href="/notification"
          prefetch={true}
          className="relative grid size-9 place-items-center rounded-lg border border-border/70 text-ink-muted hover:bg-surface-container-low hover:text-ink transition-colors"
          aria-label="View notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 font-mono text-[9px] font-bold text-white">
            3
          </span>
        </Link>

        {/* User Identity Chip */}
        <button
          type="button"
          onClick={onOpenDemoSelector}
          className="flex items-center gap-2 pl-2 border-l border-border/70 text-left hover:opacity-80 transition-opacity"
          title="Switch Demo Role"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-white shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : role[0]}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-ink leading-tight truncate max-w-[120px]">
              {user?.name || "Operations User"}
            </span>
            <span className="font-mono text-[10px] text-primary font-semibold leading-tight uppercase">
              {role}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
