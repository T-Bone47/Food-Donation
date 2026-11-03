"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Textarea, controlClass } from "@/components/ui/input";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { EmptyState, ErrorState, InlineAlert, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { Pager } from "@/components/ui/pager";
import { adminApi } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { NgoVerificationRequest } from "@/lib/types";

const PAGE_SIZE = 20;
const FILTERS = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["", "All"],
] as const;

type Decision = "approved" | "rejected" | "";

export default function VerificationsPanel() {
  const toast = useToast();
  const [status, setStatus] = useState<string>("pending");
  const [page, setPage] = useState(0);
  const [reviewing, setReviewing] = useState<NgoVerificationRequest | null>(null);
  const [decision, setDecision] = useState<Decision>("");
  const [notes, setNotes] = useState("");

  const list = useResource(
    async () =>
      (await adminApi.getVerifications({ status: status || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })).data.verifications,
    `${status}|${page}`
  );
  const rows = list.data ?? [];

  function openReview(v: NgoVerificationRequest) {
    setReviewing(v);
    setDecision("");
    setNotes("");
  }

  const rejecting = decision === "rejected";

  return (
    <section aria-labelledby="verifications-heading">
      <h2 id="verifications-heading" className="sr-only">
        NGO verifications
      </h2>

      <div className="mb-4 max-w-xs rounded-lg border bg-card p-4 shadow-card">
        <Field label="Show">
          {(c) => (
            <select
              {...c}
              className={controlClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              {FILTERS.map(([value, label]) => (
                <option key={value || "all"} value={value}>
                  {label}
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
        <Skeleton className="h-48 w-full" />
      ) : list.error && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.reload()} />
      ) : rows.length === 0 && page === 0 ? (
        <EmptyState icon={ShieldCheck} title={status === "pending" ? "Nothing waiting for review" : "No requests match"}>
          {status === "pending" ? "New NGO verification requests will appear here." : "Try a different filter."}
        </EmptyState>
      ) : (
        <div aria-busy={list.loading} className={list.loading ? "opacity-60" : undefined}>
          <ul className="flex flex-col gap-4">
            {rows.map((v) => (
              <li key={v.id} className="rounded-lg border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold">{v.organization_name}</h3>
                    <p className="text-sm text-ink-soft">
                      Registration {v.registration_number} · submitted by {v.users?.name ?? "unknown"}
                      {v.users?.email ? ` (${v.users.email})` : ""}
                    </p>
                  </div>
                  <VerificationBadge status={v.verification_status} />
                </div>
                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold">Contact</dt>
                    <dd className="break-words text-ink-soft">
                      {v.contact_person}, {v.contact_phone}
                      <br />
                      {v.contact_email}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Address</dt>
                    <dd className="break-words text-ink-soft">{v.address}</dd>
                  </div>
                  {v.description ? (
                    <div className="sm:col-span-2">
                      <dt className="font-semibold">About</dt>
                      <dd className="whitespace-pre-line break-words text-ink-soft">{v.description}</dd>
                    </div>
                  ) : null}
                  {v.verification_status !== "pending" ? (
                    <div className="sm:col-span-2">
                      <dt className="font-semibold">Decision</dt>
                      <dd className="break-words text-ink-soft">
                        {v.verified_at ? `Decided ${formatDate(v.verified_at)}. ` : ""}
                        {v.verification_notes || "No notes were recorded."}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {v.verification_status === "pending" ? (
                  <Button className="mt-4" onClick={() => openReview(v)}>
                    Review<span className="sr-only"> {v.organization_name}</span>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <Pager label="Verification pages" page={page} pageSize={PAGE_SIZE} count={rows.length} loading={list.loading} onPage={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={reviewing !== null}
        title={reviewing ? `Review ${reviewing.organization_name}` : "Review"}
        description="Approving lets this NGO receive deliveries. Either way, they are notified in the app."
        confirmLabel={rejecting ? "Reject NGO" : "Approve NGO"}
        tone={rejecting ? "destructive" : "default"}
        confirmDisabled={decision === "" || (rejecting && notes.trim() === "")}
        onConfirm={async () => {
          if (!reviewing || decision === "") return;
          await adminApi.reviewVerification(reviewing.id, { decision, notes: notes.trim() || undefined });
          toast.show(`${reviewing.organization_name} was ${decision}.`);
          await list.reload(true);
        }}
        onClose={() => setReviewing(null)}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Decision</legend>
          {(
            [
              ["approved", "Approve"],
              ["rejected", "Reject"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
              <input
                type="radio"
                name="decision"
                value={value}
                checked={decision === value}
                onChange={() => setDecision(value)}
                className="size-5 accent-primary"
              />
              {label}
            </label>
          ))}
        </fieldset>
        <Field
          label="Notes for the NGO"
          required={rejecting}
          hint={rejecting ? "Required when rejecting, so they know what to fix. They will see this." : "Optional. They will see this."}
        >
          {(c) => <Textarea {...c} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </ConfirmDialog>
    </section>
  );
}
