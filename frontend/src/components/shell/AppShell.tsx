"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/states";
import AppSidebar from "@/components/shell/AppSidebar";
import AppHeader from "@/components/shell/AppHeader";
import DemoRoleSelectorModal from "@/components/demo/DemoRoleSelectorModal";
import GuidedDemoAssistant from "@/components/demo/GuidedDemoAssistant";
import { HOME_BY_ROLE, normalizeRole, useCurrentUser } from "@/lib/session";
import type { UserRole } from "@/lib/types";

/**
 * Enterprise Application Shell:
 * - Persistent left sidebar with role-aware navigation groups (w-64)
 * - Fixed top workspace header with breadcrumbs, notifications, and demo triggers
 * - Edge-to-edge responsive workspace canvas with zero heading clipping
 */
export default function AppShell({
  roles,
  className,
  children,
}: {
  roles?: readonly UserRole[];
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, ready } = useCurrentUser();
  const role = normalizeRole(user?.role);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [demoSelectorOpen, setDemoSelectorOpen] = useState(false);
  const [guidedDemoOpen, setGuidedDemoOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  let body: ReactNode;
  if (!ready || !user) {
    body = (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">Loading…</span>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  } else if (roles && (!role || !roles.includes(role))) {
    body = (
      <EmptyState
        as="h1"
        icon={ShieldAlert}
        title={`This page is for ${roles.join(" or ")} accounts`}
        action={
          role ? (
            <Button asChild>
              <Link href={HOME_BY_ROLE[role]}>Go to your dashboard</Link>
            </Button>
          ) : undefined
        }
      >
        {role ? `You're signed in as ${role}.` : "Sign in with the right account to continue."}
      </EmptyState>
    );
  } else {
    body = children;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:font-semibold focus:shadow-raised"
      >
        Skip to main content
      </a>

      {/* Desktop Persistent Left Sidebar & Mobile Drawer */}
      <AppSidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onOpenDemoSelector={() => setDemoSelectorOpen(true)}
        onOpenGuidedDemo={() => setGuidedDemoOpen(true)}
      />

      {/* Main Column: Header + Workspace Canvas */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-72">
        <AppHeader
          onOpenMobile={() => setMobileNavOpen(true)}
          onOpenDemoSelector={() => setDemoSelectorOpen(true)}
          onOpenGuidedDemo={() => setGuidedDemoOpen(true)}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10",
            className
          )}
        >
          {body}
        </main>
      </div>

      {/* Interactive Demo Role Switcher Modal */}
      <DemoRoleSelectorModal
        isOpen={demoSelectorOpen}
        onClose={() => setDemoSelectorOpen(false)}
      />

      {/* Guided Presentation Assistant Drawer */}
      <GuidedDemoAssistant
        isOpen={guidedDemoOpen}
        onClose={() => setGuidedDemoOpen(false)}
      />
    </div>
  );
}
