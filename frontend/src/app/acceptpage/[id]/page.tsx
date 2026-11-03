"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Journey } from "@/components/ui/journey";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/ui/states";
import { donationsApi } from "@/lib/api-client";
import { formatDateTime, formatLocation, formatQuantity } from "@/lib/format";
import { normalizeRole, useCurrentUser } from "@/lib/session";
import { useResource } from "@/lib/use-resource";
import type { Donation, UserRole } from "@/lib/types";

// The route keeps its original name; it is now the read-only detail page for any donation the signed-in user may see.
const BACK: Record<UserRole, { href: string; label: string }> = {
  Donor: { href: "/mydonations", label: "Back to my donations" },
  Volunteer: { href: "/volunteer/tasks", label: "Back to my tasks" },
  NGO: { href: "/ngodash", label: "Back to deliveries" },
  Admin: { href: "/adminpage", label: "Back to the console" },
};

export default function DonationDetailPage() {
  return (
    <AppShell>
      <DonationDetail />
    </AppShell>
  );
}

function DonationDetail() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { user } = useCurrentUser();
  const role = normalizeRole(user?.role);
  const back = role ? BACK[role] : null;
  const detail = useResource(async () => (await donationsApi.getById(id)).data.donation, `donation:detail:${id}`);
  const d = detail.data;

  const backLink = back ? (
    <Button asChild variant="outline">
      <Link href={back.href}>{back.label}</Link>
    </Button>
  ) : undefined;

  if (detail.loading && !d) return <ListSkeleton count={1} className="sm:grid-cols-1 lg:grid-cols-1" />;
  if (detail.error && !d) {
    return (
      <>
        <PageHeader title="Donation details" actions={backLink} />
        <ErrorState error={detail.error} onRetry={() => detail.reload()} title="We couldn't open this donation" />
      </>
    );
  }
  if (!d) return null;

  return (
    <>
      <PageHeader title={d.title} description={`${formatQuantity(d.quantity, d.unit)} · ${d.food_category}`} actions={backLink} />
      <div className="flex flex-col gap-8">
        <section aria-labelledby="progress" className="rounded-lg border bg-card p-5 shadow-card sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="progress" className="text-heading font-semibold">
              Progress
            </h2>
            <StatusBadge status={d.status} />
          </div>
          <Journey status={d.status} times={timesFor(d)} />
          <p className="mt-5 text-meta text-muted-foreground">
            This page records when the donation was listed and when it reached its current step. Volunteers see every step&apos;s time in My tasks; admins see them in the console.
          </p>
        </section>

        <section aria-labelledby="facts" className="rounded-lg border bg-card p-5 shadow-card sm:p-6">
          <h2 id="facts" className="mb-4 text-heading font-semibold">
            Details
          </h2>
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="font-semibold">Pickup address</dt>
              <dd className="mt-1 flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0 break-words text-ink-soft">{formatLocation(d)}</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatLocation(d))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 font-semibold text-primary underline underline-offset-2"
                >
                  Search in Maps
                  <ExternalLink aria-hidden className="size-4" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Collect by</dt>
              <dd className="mt-1 text-ink-soft">{formatDateTime(d.pickup_deadline)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Safe to eat until</dt>
              <dd className="mt-1 text-ink-soft">{formatDateTime(d.expires_at)}</dd>
            </div>
            {d.prepared_at ? (
              <div>
                <dt className="font-semibold">Prepared</dt>
                <dd className="mt-1 text-ink-soft">{formatDateTime(d.prepared_at)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-semibold">Listed</dt>
              <dd className="mt-1 text-ink-soft">{formatDateTime(d.created_at)}</dd>
            </div>
            {d.description ? (
              <div className="sm:col-span-2">
                <dt className="font-semibold">Description</dt>
                <dd className="mt-1 whitespace-pre-line break-words text-ink-soft">{d.description}</dd>
              </div>
            ) : null}
          </dl>
          {role === "Volunteer" && ["ASSIGNED", "PICKED_UP", "DELIVERED"].includes(d.status) ? (
            <p className="mt-5 border-t-2 border-dashed border-border pt-4 text-sm">
              <Link href="/volunteer/tasks" className="font-semibold text-primary underline underline-offset-2">
                Manage this pickup in My tasks
              </Link>
            </p>
          ) : null}
        </section>
      </div>
    </>
  );
}

/**
 * GET /donations/:id carries no per-step timestamps. What it does know: when the donation was listed, and (because every
 * transition updates `updated_at`) when it entered its current state. Earlier steps are shown without a time, never invented.
 */
function timesFor(d: Donation) {
  return d.status === "AVAILABLE"
    ? { AVAILABLE: d.created_at }
    : { AVAILABLE: d.created_at, [d.status]: d.updated_at };
}
