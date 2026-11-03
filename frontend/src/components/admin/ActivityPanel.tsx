"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { controlClass } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { EmptyState, ErrorState, InlineAlert, Skeleton } from "@/components/ui/states";
import DonationDetail from "@/components/admin/DonationDetail";
import { adminApi } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const PAGE_SIZE = 25;
// The only two actions the backend writes today (backend/routes/admin.routes.js). Unknown ones fall back to their raw name.
const ACTIONS: Record<string, string> = {
  "donation.expired": "Expired a donation",
  "user.status_changed": "Changed an account's status",
};

/** Read-only. Nothing on this screen can change data. */
export default function ActivityPanel() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(0);
  const [openDonation, setOpenDonation] = useState<string | null>(null);

  const logs = useResource(
    async () => (await adminApi.getAuditLogs({ action: action || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })).data.logs,
    `${action}|${page}`
  );
  // Log rows carry only the actor's id. Only admins perform logged actions, so resolve names from the admin list.
  const admins = useResource(async () => (await adminApi.getUsers({ role: "Admin", limit: 100 })).data.users);
  const names = new Map((admins.data ?? []).map((u) => [u.id, u.name]));
  const actor = (id: string | null) => (id ? (names.get(id) ?? `Admin ${id.slice(0, 8)}`) : "System");
  const rows = logs.data ?? [];

  return (
    <section aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="sr-only">
        Admin activity
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-ink-soft">
        A read-only record of administrator actions. Today it records expiring a donation and changing an account&apos;s status; other actions, such as NGO verification decisions, are not logged here.
      </p>

      <div className="mb-4 max-w-xs rounded-lg border bg-card p-4 shadow-card">
        <Field label="Action">
          {(c) => (
            <select {...c} className={controlClass} value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }}>
              <option value="">All actions</option>
              {Object.entries(ACTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {logs.error && logs.data ? (
        <InlineAlert tone="warning" className="mb-4">
          <p>We couldn&apos;t refresh this log. You&apos;re seeing the last version we loaded.</p>
        </InlineAlert>
      ) : null}

      {logs.loading && !logs.data ? (
        <Skeleton className="h-64 w-full" />
      ) : logs.error && !logs.data ? (
        <ErrorState error={logs.error} onRetry={() => logs.reload()} />
      ) : rows.length === 0 && page === 0 ? (
        <EmptyState icon={ScrollText} title={action ? "No matching activity" : "No admin activity recorded yet"}>
          {action ? "Try another action." : "Entries appear here when an admin expires a donation or changes an account's status."}
        </EmptyState>
      ) : (
        <div aria-busy={logs.loading} className={logs.loading ? "opacity-60" : undefined}>
          <div data-ui="admin-table" className="hidden overflow-x-auto rounded-lg border bg-card shadow-card md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Administrator actions, newest first</caption>
              <thead className="border-b bg-muted text-ink-soft"> {/* taste-skill-ignore */}
                <tr>
                  {["When", "Admin", "What happened", "Details"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y"> {/* taste-skill-ignore */}
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(l.created_at)}</td>
                    <td className="px-4 py-3">{actor(l.actor_id)}</td>
                    <td className="px-4 py-3 font-medium">{ACTIONS[l.action] ?? l.action}</td>
                    <td className="max-w-80 break-words px-4 py-3 text-ink-soft">
                      {l.reason ?? "—"}
                      {l.resource_type === "donation" && l.resource_id ? (
                        <>
                          {" "}
                          <Button size="sm" variant="ghost" onClick={() => setOpenDonation(l.resource_id)}>
                            View donation
                          </Button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((l) => (
              <li key={l.id} className="rounded-lg border bg-card p-4 shadow-card">
                <p className="font-semibold">{ACTIONS[l.action] ?? l.action}</p>
                <p className="text-sm text-ink-soft">
                  {actor(l.actor_id)} · {formatDateTime(l.created_at)}
                </p>
                {l.reason ? <p className="mt-2 break-words text-sm text-ink-soft">{l.reason}</p> : null}
                {l.resource_type === "donation" && l.resource_id ? (
                  <Button className="mt-3" size="sm" variant="outline" onClick={() => setOpenDonation(l.resource_id)}>
                    View donation
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>

          <Pager label="Activity pages" page={page} pageSize={PAGE_SIZE} count={rows.length} loading={logs.loading} onPage={setPage} />
        </div>
      )}

      {openDonation ? <DonationDetail id={openDonation} onClose={() => setOpenDonation(null)} onChanged={() => logs.reload(true)} /> : null}
    </section>
  );
}
