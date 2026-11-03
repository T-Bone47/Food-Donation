"use client";

import { useState, type FormEvent } from "react";
import { Package, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, controlClass } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, InlineAlert, Skeleton } from "@/components/ui/states";
import { Pager } from "@/components/ui/pager";
import DonationDetail from "@/components/admin/DonationDetail";
import { adminApi } from "@/lib/api-client";
import { formatQuantity, formatWhen, statusLabel } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { useRealtimeEvent } from "@/lib/realtime";
import { DONATION_STATUSES, type DonationStatus } from "@/lib/types";

const PAGE_SIZE = 20;

export default function DonationsPanel() {
  const [status, setStatus] = useState<"" | DonationStatus>("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useResource(
    async () =>
      (
        await adminApi.getDonations({
          status: status || undefined,
          search: search || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        })
      ).data.donations,
    `${status}|${search}|${page}`
  );
  const rows = list.data ?? [];
  const filtered = status !== "" || search !== "";

  // Real-time multi-role sync
  useRealtimeEvent(["donation.*", "demo.reset"], () => {
    list.reload(true);
  });

  function applySearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText.trim());
    setPage(0);
  }
  function clearFilters() {
    setStatus("");
    setSearchText("");
    setSearch("");
    setPage(0);
  }

  return (
    <section aria-labelledby="donations-heading">
      <h2 id="donations-heading" className="sr-only">
        Donations
      </h2>

      <div className="mb-4 grid gap-3 rounded-lg border bg-card p-4 shadow-card sm:grid-cols-[14rem_1fr] sm:items-end">
        <Field label="Status">
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
              <option value="">All statuses</option>
              {DONATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <form role="search" onSubmit={applySearch} className="flex items-end gap-2">
          <Field label="Search title or description" className="min-w-0 flex-1">
            {(c) => <Input {...c} type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} />}
          </Field>
          <Button type="submit" variant="outline">
            <Search aria-hidden />
            Search
          </Button>
        </form>
      </div>

      {list.error && list.data ? (
        <InlineAlert tone="warning" className="mb-4">
          <p>We couldn&apos;t refresh this list. You&apos;re seeing the last version we loaded.</p>
        </InlineAlert>
      ) : null}

      {list.loading && !list.data ? (
        <Skeleton className="h-64 w-full" />
      ) : list.error && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.reload()} />
      ) : rows.length === 0 && page === 0 ? (
        <EmptyState
          icon={Package}
          title={filtered ? "No donations match these filters" : "No donations yet"}
          action={filtered ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : undefined}
        >
          {filtered ? "Try a different status or search term." : "Donations appear here as soon as donors post them."}
        </EmptyState>
      ) : (
        <div aria-busy={list.loading} className={list.loading ? "opacity-60" : undefined}>
          {/* `relative` contains the sr-only text: absolutely-positioned children would otherwise escape this scroller and widen the page. */}
          <div className="relative hidden overflow-x-auto rounded-lg border bg-card shadow-card md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Donations, newest first</caption>
              <thead className="border-b bg-muted text-ink-soft"> {/* taste-skill-ignore */}
                <tr>
                  {["Donation", "Donor", "Quantity", "Status", "Pick up by", "Listed", ""].map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-3 font-semibold">
                      {h ? h : <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y"> {/* taste-skill-ignore */}
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className="max-w-64 px-4 py-3">
                      <p className="break-words font-semibold">{d.title}</p>
                      <p className="text-meta text-muted-foreground">{d.food_category}</p>
                    </td>
                    <td className="px-4 py-3">{d.users?.name ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatQuantity(d.quantity, d.unit)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatWhen(d.pickup_deadline)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatWhen(d.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(d.id)}>
                        View<span className="sr-only"> details for {d.title}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((d) => (
              <li key={d.id} className="rounded-lg border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words font-semibold">{d.title}</p>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {formatQuantity(d.quantity, d.unit)} · {d.food_category}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-meta text-muted-foreground">Donor</dt>
                    <dd className="break-words">{d.users?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-meta text-muted-foreground">Pick up by</dt>
                    <dd>{formatWhen(d.pickup_deadline)}</dd>
                  </div>
                </dl>
                <Button className="mt-3 w-full" variant="outline" onClick={() => setSelectedId(d.id)}>
                  View details<span className="sr-only"> for {d.title}</span>
                </Button>
              </li>
            ))}
          </ul>

          <Pager label="Donations pages" page={page} pageSize={PAGE_SIZE} count={rows.length} loading={list.loading} onPage={setPage} />
        </div>
      )}

      {selectedId ? <DonationDetail id={selectedId} onClose={() => setSelectedId(null)} onChanged={() => list.reload(true)} /> : null}
    </section>
  );
}
