"use client";

import Link from "next/link";
import { useState } from "react";
import { Ban, Bell, CircleCheck, PackageCheck, PackageOpen, PackagePlus, ShieldCheck, TimerOff, UserCheck, type LucideIcon } from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, InlineAlert, ListSkeleton, PageHeader } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { notificationsApi } from "@/lib/api-client";
import { errorMessages, getApiError, type ApiError } from "@/lib/api-envelope";
import { formatAgo, formatDateTime } from "@/lib/format";
import { normalizeRole, useCurrentUser } from "@/lib/session";
import { useNow } from "@/lib/use-now";
import { useResource } from "@/lib/use-resource";
import type { AppNotification, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

// Event names are the ones backend/services/notification.service.js emits.
const EVENT_ICON: Record<string, LucideIcon> = {
  "donation.created": PackagePlus,
  "donation.claimed": UserCheck,
  "donation.pickup_recorded": PackageCheck,
  "donation.delivered": PackageOpen,
  "donation.completed": CircleCheck,
  "donation.cancelled": Ban,
  "donation.expired": TimerOff,
  "ngo.verification_submitted": ShieldCheck,
  "ngo.verification_decided": ShieldCheck,
};

/** Where a notification should take this person. Every target is a route their role can open. */
function destination(n: AppNotification, role: UserRole | null): { href: string; label: string } | null {
  if (n.event_type === "ngo.verification_decided") return { href: "/ngodash", label: "View verification" };
  if (n.event_type === "ngo.verification_submitted") return { href: "/adminpage", label: "Open the console" };
  if (!n.event_type.startsWith("donation.")) return null;
  const id = n.data?.donationId;
  switch (role) {
    case "Donor":
      return id ? { href: `/acceptpage/${id}`, label: "View progress" } : { href: "/mydonations", label: "My donations" };
    case "Volunteer":
      return { href: "/volunteer/tasks", label: "Open My tasks" };
    case "NGO":
      return { href: "/ngodash", label: "Review deliveries" };
    case "Admin":
      return { href: "/adminpage", label: "Open the console" };
    default:
      return null;
  }
}

export default function NotificationsPage() {
  return (
    <AppShell>
      <Notifications />
    </AppShell>
  );
}

function Notifications() {
  const toast = useToast();
  const now = useNow();
  const { user } = useCurrentUser();
  const role = normalizeRole(user?.role);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const list = useResource(
    async () => (await notificationsApi.getAll({ limit: 50, unreadOnly: unreadOnly ? "true" : undefined })).data.notifications,
    `notifications:list:${unreadOnly}`
  );
  const items = list.data ?? [];
  const unreadCount = items.filter((n) => !n.read).length;

  async function markRead(id: string) {
    setBusyId(id);
    setActionError(null);
    try {
      await notificationsApi.markRead(id);
      await list.reload(true);
    } catch (e) {
      setActionError(getApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function markAll() {
    setMarkingAll(true);
    setActionError(null);
    try {
      await notificationsApi.markAllRead();
      toast.show("All notifications marked as read.");
      await list.reload(true);
    } catch (e) {
      setActionError(getApiError(e));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your donations, pickups and deliveries."
        actions={
          <Button variant="outline" onClick={markAll} loading={markingAll} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        }
      />

      <label className="mb-4 flex min-h-11 w-fit cursor-pointer items-center gap-3 text-sm font-medium">
        <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="size-5 accent-primary" />
        Show unread only
      </label>

      {actionError ? (
        <InlineAlert tone="error" title="That didn't work" onDismiss={() => setActionError(null)} className="mb-4">
          {errorMessages(actionError).map((m) => (
            <p key={m}>{m}</p>
          ))}
        </InlineAlert>
      ) : null}

      {list.loading && !list.data ? (
        <ListSkeleton count={3} className="sm:grid-cols-1 lg:grid-cols-1" />
      ) : list.error && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.reload()} />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title={unreadOnly ? "No unread notifications" : "You're all caught up"}>
          {unreadOnly ? "Everything has been read." : "Updates about your donations will appear here."}
        </EmptyState>
      ) : (
        <>
          <ul aria-busy={list.loading} data-ui="notification-list" className={cn("divide-y overflow-hidden rounded-lg border bg-card shadow-card", list.loading && "opacity-60")}>
            {items.map((n) => {
              const Icon = EVENT_ICON[n.event_type] ?? Bell;
              const dest = destination(n, role);
              return (
                <li key={n.id} className={cn("flex gap-3 p-4", !n.read && "bg-primary-soft")}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border bg-card text-primary">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words">
                      <span className={n.read ? "font-medium" : "font-semibold"}>{n.title}</span>
                      {!n.read ? <span className="sr-only"> (unread)</span> : null}
                    </p>
                    <p className="break-words text-sm text-ink-soft">{n.message}</p>
                    <p className="mt-1 text-meta text-muted-foreground">
                      <time dateTime={n.created_at} title={formatDateTime(n.created_at)}>
                        {formatAgo(n.created_at, now)}
                      </time>
                    </p>
                    {dest || !n.read ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {dest ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={dest.href}>{dest.label}</Link>
                          </Button>
                        ) : null}
                        {!n.read ? (
                          <Button size="sm" variant="ghost" loading={busyId === n.id} onClick={() => markRead(n.id)}>
                            Mark as read<span className="sr-only">: {n.title}</span>
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {!n.read ? <span aria-hidden className="mt-2 size-2.5 shrink-0 rounded-full bg-primary" /> : null}
                </li>
              );
            })}
          </ul>
          {items.length >= 50 ? <p className="mt-2 text-meta text-muted-foreground">Showing your 50 most recent notifications.</p> : null}
        </>
      )}
    </>
  );
}
