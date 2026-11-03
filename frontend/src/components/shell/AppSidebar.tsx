"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeftRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flame,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  ShieldCheck,
  Truck,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { HOME_BY_ROLE, normalizeRole, signOut, useCurrentUser } from "@/lib/session";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_BY_ROLE: Record<UserRole, NavSection[]> = {
  Admin: [
    {
      title: "Operations",
      items: [
        { href: "/adminpage", label: "Dashboard", icon: LayoutDashboard },
        { href: "/adminpage?tab=donations", label: "All Donations", icon: Truck },
        { href: "/adminpage?tab=verifications", label: "NGO Verifications", icon: ShieldCheck },
        { href: "/adminpage?tab=activity", label: "Audit Logs", icon: FileText },
      ],
    },
    {
      title: "Management",
      items: [
        { href: "/adminpage?tab=users", label: "Users & NGOs", icon: Building2 },
        { href: "/notification", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Admin Profile", icon: User },
      ],
    },
  ],
  Donor: [
    {
      title: "Operations",
      items: [
        { href: "/donordash", label: "Dashboard", icon: LayoutDashboard },
        { href: "/donate", label: "Create Donation", icon: PlusCircle },
        { href: "/mydonations", label: "My Donations", icon: Package },
      ],
    },
    {
      title: "Management",
      items: [
        { href: "/notification", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Profile", icon: User },
      ],
    },
  ],
  Volunteer: [
    {
      title: "Operations",
      items: [
        { href: "/volunteerdash", label: "Available Food", icon: LayoutDashboard },
        { href: "/volunteer/tasks", label: "My Deliveries", icon: ClipboardList },
      ],
    },
    {
      title: "Management",
      items: [
        { href: "/notification", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Profile", icon: User },
      ],
    },
  ],
  NGO: [
    {
      title: "Operations",
      items: [
        { href: "/ngodash", label: "Receiving Hub", icon: LayoutDashboard },
        { href: "/ngodash?tab=incoming", label: "Incoming Deliveries", icon: Truck },
        { href: "/ngodash?tab=history", label: "Received History", icon: CheckCircle2 },
      ],
    },
    {
      title: "Management",
      items: [
        { href: "/notification", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Organization Profile", icon: Building2 },
      ],
    },
  ],
};

export default function AppSidebar({
  mobileOpen,
  onCloseMobile,
  onOpenDemoSelector,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenDemoSelector: () => void;
  onOpenGuidedDemo?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const role = normalizeRole(user?.role) || "Donor";
  const navSections = NAV_BY_ROLE[role] || NAV_BY_ROLE.Donor;
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    const updateUrl = () => {
      if (typeof window !== "undefined") {
        setCurrentUrl(window.location.pathname + window.location.search + window.location.hash);
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

  function isItemActive(href: string) {
    const [pathPart, queryOrHash] = href.split(/[?#]/);

    if (queryOrHash) {
      if (pathname !== pathPart) return false;
      if (typeof window !== "undefined") {
        const fullCurrent = currentUrl || (window.location.pathname + window.location.search + window.location.hash);
        if (fullCurrent.includes(queryOrHash)) return true;
        // Aliases for NGO incoming and history
        if (queryOrHash.includes("incoming") && (fullCurrent.includes("awaiting") || fullCurrent.includes("incoming"))) return true;
        if (queryOrHash.includes("awaiting") && (fullCurrent.includes("awaiting") || fullCurrent.includes("incoming"))) return true;
        if (queryOrHash.includes("history") && (fullCurrent.includes("completed") || fullCurrent.includes("history"))) return true;
        if (queryOrHash.includes("completed") && (fullCurrent.includes("completed") || fullCurrent.includes("history"))) return true;
      }
      return false;
    }

    if (pathname === pathPart) {
      if (typeof window !== "undefined") {
        const fullCurrent = currentUrl || (window.location.pathname + window.location.search + window.location.hash);
        const hasTabInUrl = fullCurrent.includes("tab=") || (window.location.hash && !window.location.hash.includes("hub"));
        if (hasTabInUrl && (pathname === "/ngodash" || pathname === "/adminpage")) {
          return false;
        }
      }
      return true;
    }

    if (pathPart !== "/" && pathname.startsWith(`${pathPart}/`)) return true;
    return false;
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto">
      <div className="flex flex-col flex-1">
        {/* Brand / Emblem */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <Link
            href={HOME_BY_ROLE[role]}
            prefetch={true}
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-fixed rounded-lg"
          >
            <div className="h-9 w-9 rounded-xl bg-tertiary-fixed text-primary flex items-center justify-center font-bold shadow">
              <Flame className="size-5 fill-primary text-primary" />
            </div>
            <div className="flex flex-col font-sans">
              <span className="text-base tracking-tight leading-none text-white font-bold">
                FoodShare
              </span>
              <span className="text-[10px] text-emerald-300 font-medium tracking-wide mt-1">
                Zero-Waste Platform
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-4 py-4 space-y-6 font-sans">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="text-[11px] uppercase tracking-wider text-emerald-300/80 px-3 mb-2 font-semibold">
                {section.title}
              </div>
              <nav className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={onCloseMobile}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        active
                          ? "bg-primary-container text-white shadow-sm border border-emerald-500/20 font-semibold"
                          : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-tertiary-fixed" : "text-emerald-300/80")} />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-tertiary-fixed px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Context Role Switcher Card matching Stitch */}
      <div className="p-4 pb-6 bg-tertiary/90 border-t border-white/10 shrink-0 font-sans">
        <div className="flex items-center justify-between p-2.5 bg-primary-container/80 rounded-lg border border-emerald-500/20">
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold">
              Current Role
            </span>
            <span className="text-xs text-white font-bold tracking-wide">
              {role}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenDemoSelector}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-emerald-200 hover:bg-tertiary-fixed hover:text-primary transition-colors"
            title="Switch Demo Role"
          >
            <ArrowLeftRight className="size-3.5" />
          </button>
        </div>

        {/* User Signout Button */}
        <div className="mt-3 flex items-center justify-between px-1 text-xs">
          <div className="truncate text-emerald-200/80 text-[11px]">
            {user?.name || user?.email || "Signed in"}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-emerald-300 hover:text-white flex items-center gap-1 text-[11px] font-medium"
          >
            <LogOut className="size-3" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar: exactly w-72 (18rem) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col bg-primary text-white shadow-lg">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-primary text-white shadow-xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
