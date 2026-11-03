"use client";

import Link from "next/link";
import { useState } from "react";
import { Package } from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import DonationCard from "@/components/DonationCard";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { controlClass } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { EmptyState, ErrorState, InlineAlert, ListSkeleton, PageHeader } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { donationsApi } from "@/lib/api-client";
import { formatDateTime, statusLabel } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { DONATION_STATUSES, type Donation, type DonationStatus } from "@/lib/types";

const PAGE_SIZE = 12;

// Where each donation is, in the donor's words.
const STATUS_NOTE: Record<DonationStatus, string> = {
  AVAILABLE: "Waiting for a volunteer to claim it.",
  ASSIGNED: "A volunteer has claimed it and will collect it.",
  PICKED_UP: "Collected. On its way to an NGO.",
  DELIVERED: "Delivered. Waiting for the NGO to confirm receipt.",
  COMPLETED: "Receipt confirmed by the NGO. Thank you.",
  CANCELLED: "You cancelled this donation.",
  EXPIRED: "This listing expired before it was collected.",
};

export default function MyDonationsPage() {
  return (
    <AppShell roles={["Donor"]}>
      <MyDonations />
    </AppShell>
  );
}

function MyDonations() {
  const toast = useToast();
  const [status, setStatus] = useState<"" | DonationStatus>("");
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<Donation | null>(null);
  const list = useResource(
    async () => (await donationsApi.getMine({ status: status || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })).data.donations,
    `donor:mine:${status}|${page}`
  );
  const rows = list.data ?? [];

  return (
    <>
      <PageHeader
        title="My donations"
        description="Everything you've listed, and where each donation is right now."
        actions={
          <Button asChild>
            <Link href="/donate">Donate food</Link>
          </Button>
        }
      />

      <div className="mb-4 max-w-xs rounded-lg border bg-card p-4 shadow-card">
        <Field label="Show">
          {(c) => (
            <select
              {...c}
              className={controlClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "" | DonationStatus);
                setPage(0);
              }}
            >
              <option value="">All donations</option>
              {DONATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {list.error && list.data ? (
        <InlineAlert tone="warning" className="mb-4">
          <p>We couldn&apos;t refresh this list. You&apos;re seeing the last version we loaded.</p>
        </InlineAlert>
      ) : null}

      {list.loading && !list.data ? (
        <ListSkeleton count={4} className="lg:grid-cols-2" />
      ) : list.error && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.reload()} />
      ) : rows.length === 0 && page === 0 ? (
        <EmptyState
          icon={Package}
          title={status ? `No ${statusLabel(status).toLowerCase()} donations` : "You haven't donated yet"}
          action={
            status ? (
              <Button variant="outline" onClick={() => setStatus("")}>
                Show all donations
              </Button>
            ) : (
              <Button asChild>
                <Link href="/donate">Donate food</Link>
              </Button>
            )
          }
        >
          {status ? "Try another status." : "Your donations will be listed here, with their progress."}
        </EmptyState>
      ) : (
        <div aria-busy={list.loading} className={list.loading ? "opacity-60" : undefined}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((d) => (
              <li key={d.id}>
                <DonationCard heading="h2" donation={d} showStatus showDeadlines={d.status === "AVAILABLE" || d.status === "ASSIGNED"}>
                  <p className="text-sm text-ink-soft">{STATUS_NOTE[d.status]}</p>
                  <p className="text-meta text-muted-foreground">Listed {formatDateTime(d.created_at)}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/acceptpage/${d.id}`}>
                        View progress<span className="sr-only"> for {d.title}</span>
                      </Link>
                    </Button>
                    {d.status === "AVAILABLE" || d.status === "ASSIGNED" ? (
                      <Button variant="outline" size="sm" onClick={() => setTarget(d)}>
                        Cancel donation<span className="sr-only"> {d.title}</span>
                      </Button>
                    ) : null}
                  </div>
                </DonationCard>
              </li>
            ))}
          </ul>
          <Pager label="My donations pages" page={page} pageSize={PAGE_SIZE} count={rows.length} loading={list.loading} onPage={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={target !== null}
        tone="destructive"
        title="Cancel this donation?"
        description={
          target ? (
            <p>
              <strong>{target.title}</strong> will be removed.{" "}
              {target.status === "ASSIGNED"
                ? "A volunteer has already claimed it. Cancelling cancels their pickup, and they'll be notified in the app. "
                : "Volunteers will no longer be able to claim it. "}
              This can&apos;t be undone.
            </p>
          ) : undefined
        }
        confirmLabel="Cancel donation"
        cancelLabel="Keep donation"
        onConfirm={async () => {
          if (!target) return;
          await donationsApi.cancel(target.id);
          toast.show(`“${target.title}” was cancelled.`);
          await list.reload(true);
        }}
        // 403/404/409: it changed under us (e.g. already collected). Show the reason and refresh the list.
        onError={(err) => {
          if (err.status === 403 || err.status === 404 || err.status === 409) void list.reload(true);
        }}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
