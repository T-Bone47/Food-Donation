"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ClipboardList, ExternalLink } from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { controlClass } from "@/components/ui/input";
import { Journey } from "@/components/ui/journey";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, InlineAlert, ListSkeleton, PageHeader, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { donationsApi, ngoApi, volunteerApi } from "@/lib/api-client";
import { deadlineInfo, formatDateTime, formatLocation, formatQuantity, formatWhen } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { useResource } from "@/lib/use-resource";
import type { Donation, VolunteerTask } from "@/lib/types";

type TaskWithDonation = VolunteerTask & { donations: Donation };

export default function VolunteerTasksPage() {
  return (
    <AppShell roles={["Volunteer"]}>
      <Tasks />
    </AppShell>
  );
}

function Tasks() {
  const tasks = useResource(async () => (await volunteerApi.getTasks()).data.tasks);
  const rows = (tasks.data ?? []).filter((t): t is TaskWithDonation => t.donations !== null);
  const active = rows.find((t) => t.assignment_status === "active") ?? null;
  const history = rows.filter((t) => t !== active);

  return (
    <>
      <PageHeader
        title="My tasks"
        description="Your current pickup, what to do next, and everything you have collected before."
      />

      {tasks.loading && !tasks.data ? (
        <ListSkeleton count={2} />
      ) : tasks.error && !tasks.data ? (
        <ErrorState error={tasks.error} onRetry={() => tasks.reload()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks yet"
          action={
            <Button asChild>
              <Link href="/volunteerdash">Find food to collect</Link>
            </Button>
          }
        >
          When you claim a pickup it shows up here, with the steps to collect and deliver it.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-10">
          {tasks.error ? (
            <InlineAlert tone="warning">
              <p>We couldn&apos;t refresh your tasks. You&apos;re seeing the last version we loaded.</p>
            </InlineAlert>
          ) : null}

          {active ? (
            <ActiveTask task={active} onChanged={() => tasks.reload(true)} />
          ) : (
            <InlineAlert tone="info" title="No task in progress">
              <p>
                <Link href="/volunteerdash" className="font-semibold text-primary underline underline-offset-2">
                  Find food to collect
                </Link>{" "}
                when you are ready for the next one.
              </p>
            </InlineAlert>
          )}

          {history.length > 0 ? (
            <section aria-labelledby="task-history">
              <h2 id="task-history" className="mb-3 text-heading font-semibold">
                Task history
              </h2>
              <ul data-ui="task-history" className="divide-y rounded-lg border bg-card shadow-card">
                {history.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{t.donations.title}</p>
                      <p className="text-sm text-ink-soft">
                        {formatQuantity(t.donations.quantity, t.donations.unit)} · claimed {formatDateTime(t.assigned_at)}
                      </p>
                      {t.delivered_at ? <p className="text-meta text-muted-foreground">Delivered {formatDateTime(t.delivered_at)}</p> : null}
                    </div>
                    <StatusBadge status={t.donations.status} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

function ActiveTask({ task, onChanged }: { task: TaskWithDonation; onChanged: () => Promise<void> }) {
  const d = task.donations;
  const now = useNow();
  const pickup = deadlineInfo(d.pickup_deadline, now);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastStatus = useRef(d.status);
  // Lives here, not in the action panels: after a stale-action error the panel is replaced by the refreshed
  // state, and this is what still explains to the volunteer what happened.
  const [notice, setNotice] = useState<string | null>(null);
  const done = async () => {
    setNotice(null);
    await onChanged();
  };
  // Explain first, then refresh: `done` would clear the notice we are about to show.
  const stale = async (message: string) => {
    setNotice(`${message} We've refreshed this task.`);
    await onChanged();
  };

  // After a step succeeds the action panel changes; move focus to the task title so keyboard and
  // screen-reader users land somewhere stable instead of on a button that no longer exists.
  useEffect(() => {
    if (lastStatus.current !== d.status) {
      lastStatus.current = d.status;
      headingRef.current?.focus();
    }
  }, [d.status]);

  const mapQuery = d.latitude !== null && d.longitude !== null ? `${d.latitude},${d.longitude}` : formatLocation(d);
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <section aria-labelledby="current-task" className="rounded-lg border-2 border-primary bg-card shadow-raised">
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-meta font-semibold text-primary">Current task</p>
            <h2 id="current-task" ref={headingRef} tabIndex={-1} className="break-words text-heading font-semibold">
              {d.title}
            </h2>
            <p className="mt-1 text-sm font-medium text-ink-soft">
              {formatQuantity(d.quantity, d.unit)} · {d.food_category}
            </p>
          </div>
          <StatusBadge status={d.status} />
        </div>

        <Journey
          status={d.status}
          times={{
            AVAILABLE: d.created_at,
            ASSIGNED: task.assigned_at,
            PICKED_UP: task.picked_up_at,
            DELIVERED: task.delivered_at,
          }}
        />

        <dl className="grid gap-4 border-t-2 border-dashed border-border pt-5 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="font-semibold">Pickup address</dt>
            <dd className="mt-1 flex flex-wrap items-start justify-between gap-2">
              <span className="min-w-0 break-words">{formatLocation(d)}</span>
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center gap-1 font-semibold text-primary underline underline-offset-2"
              >
                Open in Maps
                <ExternalLink aria-hidden className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Pick up by</dt>
            <dd className="mt-1">
              {formatWhen(d.pickup_deadline, now)}
              {pickup ? <span className="text-ink-soft"> · {pickup.label}</span> : null}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Food expires</dt>
            <dd className="mt-1">{formatWhen(d.expires_at, now)}</dd>
          </div>
          {d.description ? (
            <div className="sm:col-span-2">
              <dt className="font-semibold">Notes from the donor</dt>
              <dd className="mt-1 whitespace-pre-line break-words text-ink-soft">{d.description}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex flex-col gap-3 border-t-2 border-dashed border-border pt-5">
          {notice ? (
            <InlineAlert tone="warning" role="alert" title="This task changed" onDismiss={() => setNotice(null)}>
              <p>{notice}</p>
            </InlineAlert>
          ) : null}
          {d.status === "ASSIGNED" ? <PickupAction donation={d} onChanged={done} onStale={stale} /> : null}
          {d.status === "PICKED_UP" ? <DeliveryAction donation={d} onChanged={done} onStale={stale} /> : null}
          {d.status === "DELIVERED" ? <AwaitingReceipt donation={d} /> : null}
        </div>
      </div>
    </section>
  );
}

function PickupAction({ donation, onChanged, onStale }: { donation: Donation; onChanged: () => Promise<void>; onStale: (message: string) => Promise<void> }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className="text-sm text-ink-soft">Next step: collect the food from the donor, then confirm here.</p>
      <div>
        <Button onClick={() => setOpen(true)}>Mark as picked up</Button>
      </div>
      <ConfirmDialog
        open={open}
        title="Confirm pickup"
        description={
          <p>
            Confirm you have collected <strong>{donation.title}</strong> ({formatQuantity(donation.quantity, donation.unit)}) from the
            donor. The donor will be notified in the app.
          </p>
        }
        confirmLabel="Yes, I picked it up"
        onConfirm={async () => {
          await donationsApi.pickup(donation.id);
          toast.show("Pickup recorded. Next, deliver it to an NGO.");
          await onChanged();
        }}
        // 403/404/409 mean the task changed under us: explain why, and bring the page back in sync.
        onError={(err) => {
          if (err.status === 403 || err.status === 404 || err.status === 409) void onStale(err.message);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function DeliveryAction({ donation, onChanged, onStale }: { donation: Donation; onChanged: () => Promise<void>; onStale: (message: string) => Promise<void> }) {
  const toast = useToast();
  const ngos = useResource(async () => (await ngoApi.getApprovedNGOs()).data.ngos);
  const [ngoUserId, setNgoUserId] = useState("");
  const [open, setOpen] = useState(false);
  // The API expects the NGO's *user* id here, not the ngo_profiles id.
  const selected = ngos.data?.find((n) => n.user_id === ngoUserId) ?? null;

  return (
    <>
      <p className="text-sm text-ink-soft">Next step: take it to an approved NGO, then confirm the hand-over.</p>
      {ngos.loading && !ngos.data ? (
        <Skeleton className="h-11 w-full max-w-md" />
      ) : ngos.error && !ngos.data ? (
        <ErrorState error={ngos.error} onRetry={() => ngos.reload()} title="We couldn't load the NGO list" />
      ) : ngos.data && ngos.data.length === 0 ? (
        <InlineAlert tone="warning" title="No approved NGOs yet">
          <p>An admin has to approve an NGO before you can deliver. Ask them to review pending NGO verifications.</p>
        </InlineAlert>
      ) : (
        <>
          <Field label="Deliver to" required className="max-w-md">
            {(control) => (
              <select {...control} className={controlClass} value={ngoUserId} onChange={(e) => setNgoUserId(e.target.value)}>
                <option value="">Choose an NGO…</option>
                {ngos.data?.map((n) => (
                  <option key={n.user_id} value={n.user_id}>
                    {n.organization_name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {selected ? (
            <dl className="max-w-md rounded-md bg-muted p-3 text-sm">
              <dt className="font-semibold">Address</dt>
              <dd className="break-words text-ink-soft">{selected.address}</dd>
              <dt className="mt-2 font-semibold">Contact</dt>
              <dd className="text-ink-soft">
                {selected.contact_person} ·{" "}
                <a href={`tel:${selected.contact_phone}`} className="font-semibold text-primary underline underline-offset-2">
                  {selected.contact_phone}
                </a>
              </dd>
            </dl>
          ) : null}
          <div>
            <Button disabled={!selected} onClick={() => setOpen(true)}>
              Mark as delivered
            </Button>
          </div>
        </>
      )}
      <ConfirmDialog
        open={open}
        title="Confirm delivery"
        description={
          <p>
            Confirm you handed <strong>{donation.title}</strong> to <strong>{selected?.organization_name}</strong>. They will be asked to
            confirm receipt, and your next pickup unlocks once they do.
          </p>
        }
        confirmLabel="Yes, I delivered it"
        onConfirm={async () => {
          await donationsApi.deliver(donation.id, ngoUserId);
          toast.show("Delivery recorded. Waiting for the NGO to confirm.");
          await onChanged();
        }}
        onError={(err) => {
          if (err.status === 403 || err.status === 404 || err.status === 409) void onStale(err.message);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function AwaitingReceipt({ donation }: { donation: Donation }) {
  const ngos = useResource(async () => (await ngoApi.getApprovedNGOs()).data.ngos);
  const ngo = ngos.data?.find((n) => n.user_id === donation.recipient_ngo_id);
  return (
    <InlineAlert tone="info" title="Delivered. Waiting for the NGO to confirm receipt">
      <p>
        {ngo ? ngo.organization_name : "The receiving NGO"} has to confirm before this task closes. You can claim another pickup as soon as
        they do.
      </p>
    </InlineAlert>
  );
}
