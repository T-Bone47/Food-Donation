"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Bell, ClipboardList, LayoutDashboard, LogOut, Package, Search, ShieldCheck, Soup, Truck, User, Sparkles, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HOME_BY_ROLE, normalizeRole, signOut, useCurrentUser, type StoredUser } from "@/lib/session";
import type { UserRole } from "@/lib/types";
import GuidedDemoAssistant from "@/components/demo/GuidedDemoAssistant";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SHARED: NavItem[] = [
  { href: "/notification", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

// Four destinations or fewer per role: a top bar on desktop, a bottom tab bar on phones.
const NAV: Record<UserRole, NavItem[]> = {
  Donor: [
    { href: "/donordash", label: "Overview", icon: LayoutDashboard },
    { href: "/mydonations", label: "My donations", icon: Package },
    ...SHARED,
  ],
  Volunteer: [
    { href: "/volunteerdash", label: "Find food", icon: Search },
    { href: "/volunteer/tasks", label: "My tasks", icon: ClipboardList },
    ...SHARED,
  ],
  NGO: [{ href: "/ngodash", label: "Deliveries", icon: Truck }, ...SHARED],
  Admin: [{ href: "/adminpage", label: "Console", icon: ShieldCheck }, ...SHARED],
};

// The pages where "Donate food" is already the page's own action (or the destination), so the bar needn't repeat it.
const DONATE_CTA_HIDDEN_ON = ["/donate", "/donordash", "/mydonations"];

// A task's detail page belongs to "My tasks".
const ALSO_ACTIVE: Record<string, string> = { "/volunteer/tasks": "/acceptpage" };

function isActive(pathname: string, href: string) {
  const match = (h: string) => pathname === h || pathname.startsWith(`${h}/`);
  return match(href) || (ALSO_ACTIVE[href] ? match(ALSO_ACTIVE[href]) : false);
}

function AccountMenu({ user, role, onSignOut }: { user: StoredUser; role: UserRole | null; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        className="grid size-11 cursor-pointer place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-soft-foreground hover:bg-border"
      >
        {initial}
      </button>
      {open ? (
        <div id={panelId} data-ui="menu" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border bg-popover p-3 shadow-raised">
          {user.isDemo ? (
            <div className="mb-2 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/25">
              DEMO MODE: {role?.toUpperCase() || "DEMO"}
            </div>
          ) : null}
          <p className="truncate font-semibold">{user.name || "Your account"}</p>
          {user.email ? <p className="truncate text-meta text-muted-foreground">{user.email}</p> : null}
          {role ? <p className="mt-1 text-meta font-medium text-ink-soft">{role} account</p> : null}
          <hr className="my-3" /> {/* taste-skill-ignore */}
          <Button
            variant="ghost"
            className={cn("w-full justify-start", user.isDemo && "text-destructive hover:bg-destructive/10")}
            onClick={onSignOut}
          >
            <LogOut aria-hidden />
            {user.isDemo ? "Exit Demo" : "Sign out"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AppNav() {
  const { user, ready } = useCurrentUser();
  const role = normalizeRole(user?.role);
  const items = role ? NAV[role] : [];
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [guideOpen, setGuideOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <>
      {ready && user?.isDemo ? (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 sm:hidden flex items-center justify-between" /* taste-skill-ignore */>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500 " />
            <span>DEMO MODE ({role?.toUpperCase()})</span>
          </div>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="text-primary underline font-bold"
          >
            Guided Demo
          </button>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b bg-card" /* taste-skill-ignore */>
        <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link href={role ? HOME_BY_ROLE[role] : "/"} className="flex min-h-11 min-w-0 items-center gap-2 font-display text-lg font-bold tracking-tight text-primary">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <Soup aria-hidden className="size-5" />
            </span>
            <span className="truncate">FoodShare</span>
          </Link>

          {ready && user?.isDemo ? (
            <div className="hidden sm:flex items-center gap-2">
              <div
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300"
                title="You're exploring a demonstration environment. Changes are isolated from real accounts."
              >
                <span className="size-2 rounded-full bg-amber-500 " />
                <span>DEMO MODE</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10"
                onClick={() => setGuideOpen(true)}
              >
                <Sparkles className="size-3" />
                <span>Guided Demo</span>
              </Button>
            </div>
          ) : null}

          {items.length > 0 ? (
            <nav aria-label="Main" className="ml-2 hidden items-stretch gap-1 md:flex">
              {items.map(({ href, label }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={true}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-[var(--header-h)] items-center px-3 text-sm font-medium text-ink-soft hover:text-foreground",
                      active && "font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {role === "Donor" && !DONATE_CTA_HIDDEN_ON.includes(pathname) ? (
              <Button asChild size="sm">
                <Link href="/donate">Donate food</Link>
              </Button>
            ) : null}
            {ready && user ? (
              <AccountMenu user={user} role={role} onSignOut={handleSignOut} />
            ) : ready ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {items.length > 0 ? (
        <nav
          aria-label="Main"
          data-bottom-nav
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom,0px)] md:hidden" /* taste-skill-ignore */
        >
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-[var(--bottomnav-h)] flex-col items-center justify-center gap-1 px-1 text-center text-xs font-medium text-ink-soft [overflow-wrap:anywhere]",
                      active && "font-semibold text-foreground"
                    )}
                  >
                    <span className={cn("grid h-7 w-14 place-items-center rounded-full", active && "bg-primary-soft text-primary-soft-foreground")}>
                      <Icon aria-hidden className="size-5" />
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <GuidedDemoAssistant
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
}
