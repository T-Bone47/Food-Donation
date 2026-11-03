"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Journey, type JourneyTimes } from "@/components/ui/journey";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { adminApi, ngoApi } from "@/lib/api-client";
import { formatDateTime, formatLocation, formatQuantity, statusLabel } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { AdminDonationDetail } from "@/lib/types";

function journeyTimes(d: AdminDonationDetail): JourneyTimes {
  // A donation can have several assignment attempts (released or cancelled, then claimed again).
  // The timeline follows the latest attempt that was not abandoned, else the most recent one.
  const attempts = [...d.assignments].sort((a, b) => a.assigned_at.localeCompare(b.assigned_at));
  const live =
    [...attempts].reverse().find((a) => a.assignment_status !== "cancelled" && a.assignment_status !== "released") ??
    attempts[attempts.length - 1];
  return {
    AVAILABLE: d.created_at,
    ASSIGNED: live?.assigned_at,
    PICKED_UP: live?.picked_up_at,
    DELIVERED: live?.delivered_at,
    COMPLETED: d.delivery_confirmations[0]?.confirmed_at,
    CANCELLED: d.status === "CANCELLED" ? d.updated_at : undefined,
    EXPIRED: d.status === "EXPIRED" ? d.updated_at : undefined,
  };
}

/** Full lifecycle record for one donation. The list endpoint has no assignments, so this fetches the detail endpoint. */
export default function DonationDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const toast = useToast();
  const detail = useResource(async () => (await adminApi.getDonationById(id)).data.donation, id);
  const ngos = useResource(async () => (await ngoApi.getApprovedNGOs()).data.ngos);
  const [expiring, setExpiring] = useState(false);
  const d = detail.data;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const recipient = d?.recipient_ngo_id ? ngos.data?.find((n) => n.user_id === d.recipient_ngo_id) : undefined;

  return (
    <dialog
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      // Ignore close events bubbling up from the nested Expire confirmation (see ConfirmDialog).
      onClose={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-2xl rounded-lg bg-card p-0 text-card-foreground shadow-overlay"
    >
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="break-words text-heading font-semibold">
              {d ? d.title : "Donation details"}
            </h2>
            {d ? (
              <p className="mt-1 text-meta text-muted-foreground">
                ID <code data-ui="id" className="select-all break-all font-mono text-xs">{d.id}</code>
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close details" onClick={() => ref.current?.close()}>
            <X aria-hidden />
          </Button>
        </div>

        {detail.loading && !d ? (
          <div role="status" className="flex flex-col gap-3">
            <span className="sr-only">Loading donation details…</span>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detail.error && !d ? (
          <ErrorState error={detail.error} onRetry={() => detail.reload()} title="We couldn't load this donation" />
        ) : d ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={d.status} />
              <span className="text-sm text-ink-soft">
                {formatQuantity(d.quantity, d.unit)} · {d.food_category}
              </span>
            </div>

            <Journey status={d.status} times={journeyTimes(d)} />

            <dl className="grid gap-4 border-t-2 border-dashed border-border pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Donor</dt>
                <dd className="break-words text-ink-soft">
                  {d.users ? `${d.users.name} (${d.users.email})` : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Receiving NGO</dt>
                <dd className="break-words text-ink-soft">
                  {d.recipient_ngo_id ? (recipient?.organization_name ?? "Assigned NGO account") : "Not assigned yet"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold">Pickup address</dt>
                <dd className="break-words text-ink-soft">{formatLocation(d)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Pick up by</dt>
                <dd className="text-ink-soft">{formatDateTime(d.pickup_deadline)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Food expires</dt>
                <dd className="text-ink-soft">{formatDateTime(d.expires_at)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Listed</dt>
                <dd className="text-ink-soft">{formatDateTime(d.created_at)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Last updated</dt>
                <dd className="text-ink-soft">{formatDateTime(d.updated_at)}</dd>
              </div>
              {d.description ? (
                <div className="sm:col-span-2">
                  <dt className="font-semibold">Description</dt>
                  <dd className="whitespace-pre-line break-words text-ink-soft">{d.description}</dd>
                </div>
              ) : null}
            </dl>

            <section aria-labelledby={`${titleId}-assignments`}>
              <h3 id={`${titleId}-assignments`} className="mb-2 font-semibold">
                Volunteer assignments
              </h3>
              {d.assignments.length === 0 ? (
                <p className="text-sm text-ink-soft">No volunteer has claimed this donation.</p>
              ) : (
                <ul className="divide-y rounded-md border text-sm"> {/* taste-skill-ignore */}
                  {d.assignments.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-3">
                      <span className="font-medium">{a.users?.name ?? "Unknown volunteer"}</span>
                      <span className="text-ink-soft">
                        {statusLabel(a.assignment_status)} · claimed {formatDateTime(a.assigned_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {d.delivery_confirmations.length > 0 ? (
              <p className="text-sm text-ink-soft">
                Receipt confirmed {formatDateTime(d.delivery_confirmations[0].confirmed_at)}
                {d.delivery_confirmations[0].users ? ` by ${d.delivery_confirmations[0].users.name}` : ""}.
              </p>
            ) : null}

            {d.status === "AVAILABLE" ? (
              <div className="border-t-2 border-dashed border-border pt-5">
                <p className="mb-3 text-sm text-ink-soft">
                  Only listings that have not been claimed can be expired. Use this for food that is no longer safe or available.
                </p>
                <Button variant="destructive" onClick={() => setExpiring(true)}>
                  Expire this donation
                </Button>
              </div>
            ) : null}

            <ConfirmDialog
              open={expiring}
              tone="destructive"
              title="Expire this donation?"
              description={
                <p>
                  <strong>{d.title}</strong> will be removed from volunteers&apos; lists and the donor will be notified in the app. This
                  can&apos;t be undone.
                </p>
              }
              confirmLabel="Expire donation"
              onConfirm={async () => {
                await adminApi.expireDonation(d.id);
                toast.show(`“${d.title}” was expired.`);
                await detail.reload(true);
                onChanged();
              }}
              // 409: it was claimed or changed meanwhile. Show the reason and refresh so the Expire button disappears.
              onError={(err) => {
                if (err.status === 409 || err.status === 404) {
                  void detail.reload(true);
                  onChanged();
                }
              }}
              onClose={() => setExpiring(false)}
            />
          </>
        ) : null}
      </div>
    </dialog>
  );
}
