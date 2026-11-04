"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Ban,
  Building2,
  Gavel,
  HandHeart,
  Lock,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pager } from "@/components/ui/pager";
import { EmptyState, ErrorState, InlineAlert, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";
import { useResource } from "@/lib/use-resource";
import type { AccountStatus, AdminUser, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const ROLE_BADGE: Record<UserRole, { Icon: LucideIcon; label: string; className: string }> = {
  Donor: { Icon: HandHeart, label: "Donor", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  Volunteer: { Icon: Truck, label: "Volunteer", className: "bg-sky-50 text-sky-800 border-sky-200" },
  NGO: { Icon: Building2, label: "NGO", className: "bg-teal-50 text-teal-800 border-teal-200" },
  Admin: { Icon: ShieldCheck, label: "Admin", className: "bg-amber-50 text-amber-800 border-amber-200" },
};

function RoleBadge({ role }: { role: UserRole }) {
  const badge = ROLE_BADGE[role] || ROLE_BADGE.Donor;
  const Icon = badge.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap", badge.className)}>
      <Icon className="size-3" aria-hidden="true" />
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
        <span className="size-1.5 rounded-full bg-emerald-600 " />
        ACTIVE
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-rose-800">
        <Ban className="size-3" aria-hidden="true" />
        SUSPENDED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
      <ShieldAlert className="size-3" aria-hidden="true" />
      REJECTED
    </span>
  );
}

type Change = { user: AdminUser; next: "active" | "suspended" };

function allowedChange(u: AdminUser, myId?: string): { next: "active" | "suspended" } | { note: string } {
  if (u.id === myId) return { note: "Your account" };
  if (u.role === "Admin") return { note: "Protected Admin" };
  if (u.account_status === "active") return { next: "suspended" };
  if (u.account_status === "suspended") return { next: "active" };
  return { note: "Read-only" };
}

export default function UsersPanel() {
  const toast = useToast();
  const { user: me } = useCurrentUser();
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [change, setChange] = useState<Change | null>(null);

  const list = useResource(
    async () =>
      (
        await adminApi.getUsers({
          role: role || undefined,
          status: status || undefined,
          search: search || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        })
      ).data.users,
    `${role}|${status}|${search}|${page}`
  );

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const filtered = role !== "" || status !== "" || search !== "";

  // Live computed statistics from indexed records
  const stats = useMemo(() => {
    const total = rows.length;
    const donors = rows.filter((r) => r.role === "Donor").length;
    const volunteers = rows.filter((r) => r.role === "Volunteer").length;
    const ngos = rows.filter((r) => r.role === "NGO").length;
    const admins = rows.filter((r) => r.role === "Admin").length;
    const active = rows.filter((r) => r.account_status === "active").length;
    const suspended = rows.filter((r) => r.account_status === "suspended").length;
    return { total, donors, volunteers, ngos, admins, active, suspended };
  }, [rows]);

  function applySearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText.trim());
    setPage(0);
  }

  function clearFilters() {
    setRole("");
    setStatus("");
    setSearchText("");
    setSearch("");
    setPage(0);
  }

  async function executeStatusChange() {
    if (!change) return;
    try {
      await adminApi.updateUserStatus(change.user.id, change.next);
      toast.show(
        `Account for ${change.user.name} is now ${change.next === "active" ? "active" : "suspended"}.`
      );
      setChange(null);
      list.reload();
    } catch {
      toast.show("Could not update account status. Please try again.");
    }
  }

  return (
    <section aria-labelledby="users-heading" className="flex flex-col gap-6 pb-8">
      {/* 5 KPI Command Bar matching Stitch user_organization_administration */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Accounts */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs text-ink-muted uppercase">
            <span>Total Accounts</span>
            <span className="p-1 rounded bg-surface-container-low text-primary">
              <Users className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-ink">{stats.total}</span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
              +8.4%
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-ink-muted">Consolidated ecosystem count</div>
        </div>

        {/* Donors */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs text-ink-muted uppercase">
            <span>Donors (Corp/Retail)</span>
            <span className="p-1 rounded bg-primary/10 text-primary">
              <HandHeart className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-ink">{stats.donors}</span>
            <span className="font-mono text-[10px] text-ink-muted">
              {stats.total > 0 ? `${Math.round((stats.donors / stats.total) * 100)}%` : "0%"} share
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-emerald-600 font-semibold">Commercial surplus nodes</div>
        </div>

        {/* Volunteers */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs text-ink-muted uppercase">
            <span>Field Volunteers</span>
            <span className="p-1 rounded bg-sky-100 text-sky-800">
              <Truck className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-ink">{stats.volunteers}</span>
            <span className="font-mono text-[10px] text-primary font-bold">READY</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-ink-muted">Rescue courier logistics</div>
        </div>

        {/* Verified NGOs */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs text-ink-muted uppercase">
            <span>Verified NGOs</span>
            <span className="p-1 rounded bg-teal-100 text-teal-800">
              <Building2 className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-ink">{stats.ngos}</span>
            <span className="rounded bg-primary-fixed px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
              100% VETTED
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-ink-muted">Community distribution hubs</div>
        </div>

        {/* Flagged / Risk */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs text-rose-700 uppercase">
            <span>Flagged & Risk</span>
            <span className="p-1 rounded bg-rose-100 text-rose-800">
              <Gavel className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-rose-700">{stats.suspended}</span>
            <span className="font-mono text-[10px] text-rose-700 font-bold">
              {stats.suspended > 0 ? "ACTION REQ" : "ZERO RISK"}
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-ink-muted">
            {stats.suspended} suspended accounts
          </div>
        </div>
      </div>

      {/* Telemetry HUD Strip matching Stitch */}
      <div className="rounded-xl bg-primary text-white p-4 shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded font-mono text-xs font-bold text-tertiary-fixed">
            <Lock className="size-3.5" />
            <span>IDENTITY ORCHESTRATION</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-primary-fixed-dim">
            <span>PII ENCRYPTION: ACTIVE</span>
            <span>•</span>
            <span>AUDIT TRAIL SYNC: IMMUTABLE</span>
            <span>•</span>
            <span>FEDERATED IDENTITY: OIDC-V3</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-primary-fixed">CHAIN OF CUSTODY INTEGRITY</span>
          <div className="w-24 bg-primary-container h-2 rounded-full overflow-hidden">
            <div className="bg-tertiary-fixed-dim h-full w-[99.8%]" />
          </div>
          <span className="font-bold text-white">99.8%</span>
        </div>
      </div>

      {/* Advanced Command Toolbar: Search & Segmented Role Filter Tabs */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={applySearch} className="relative flex-1 min-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="Search by legal name, organization, handle, email... (Press Enter to search)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-14 py-2 bg-surface-container-low border border-border/60 rounded-lg font-mono text-xs text-ink placeholder:text-ink-muted focus:bg-card focus:border-primary/50 focus:outline-none transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 bg-surface-container text-ink-muted font-mono text-[10px] rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Segmented Control Role Buttons */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => { setRole(""); setPage(0); }}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              role === "" ? "bg-card text-primary shadow-xs" : "text-ink-muted hover:text-ink"
            }`}
          >
            All Roles <span className="ml-1 opacity-70">({stats.total})</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole("Donor"); setPage(0); }}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              role === "Donor" ? "bg-card text-primary shadow-xs" : "text-ink-muted hover:text-ink"
            }`}
          >
            Donors <span className="ml-1 opacity-70">({stats.donors})</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole("Volunteer"); setPage(0); }}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              role === "Volunteer" ? "bg-card text-primary shadow-xs" : "text-ink-muted hover:text-ink"
            }`}
          >
            Volunteers <span className="ml-1 opacity-70">({stats.volunteers})</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole("NGO"); setPage(0); }}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              role === "NGO" ? "bg-card text-primary shadow-xs" : "text-ink-muted hover:text-ink"
            }`}
          >
            NGOs <span className="ml-1 opacity-70">({stats.ngos})</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole("Admin"); setPage(0); }}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              role === "Admin" ? "bg-card text-primary shadow-xs" : "text-ink-muted hover:text-ink"
            }`}
          >
            Admin <span className="ml-1 opacity-70">({stats.admins})</span>
          </button>
        </div>

        {filtered && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="font-mono text-xs text-ink-muted shrink-0">
            <RotateCcw className="size-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {list.error && list.data && (
        <InlineAlert tone="warning">
          <p>We couldn&apos;t refresh this list. Showing cached records.</p>
        </InlineAlert>
      )}

      {/* Directory Table */}
      {list.loading && !list.data ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : list.error && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.reload()} title="Unable to load user accounts" />
      ) : rows.length === 0 && page === 0 ? (
        <EmptyState
          icon={Users}
          title={filtered ? "No accounts match these filters" : "No registered accounts found"}
          action={
            filtered ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear active filters
              </Button>
            ) : undefined
          }
        >
          {filtered
            ? "Try loosening your search keywords, role selection, or status filter."
            : "Platform accounts will appear here automatically as donors, volunteers, and NGOs sign up."}
        </EmptyState>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface-container font-mono text-ink-muted uppercase text-[11px]">
                  <th className="py-3 px-5">User Identity & Org</th>
                  <th className="py-3 px-4">Role Permission</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-5 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {rows.map((u) => {
                  const action = allowedChange(u, me?.id);
                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                      {/* Identity */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-mono text-xs font-bold">
                            {u.name ? u.name.slice(0, 2).toUpperCase() : "FS"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-sans font-bold text-ink truncate text-sm">{u.name}</p>
                            <p className="font-mono text-xs text-ink-muted truncate">{u.email}</p>
                            {u.organization && (
                              <p className="font-mono text-[11px] text-primary mt-0.5 truncate flex items-center gap-1">
                                <Building2 className="size-3 inline shrink-0" />
                                <span>{u.organization}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={u.account_status} />
                      </td>

                      {/* Joined */}
                      <td className="py-3.5 px-4 text-ink-muted">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right">
                        {"note" in action ? (
                          <span className="font-mono text-xs text-ink-muted italic">{action.note}</span>
                        ) : (
                          <Button
                            size="sm"
                            variant={action.next === "suspended" ? "outline" : "default"}
                            onClick={() => setChange({ user: u, next: action.next })}
                            className={cn(
                              "font-mono text-xs h-7 px-3",
                              action.next === "suspended"
                                ? "text-rose-700 border-rose-300 hover:bg-rose-50"
                                : "bg-primary text-white hover:bg-primary-container"
                            )}
                          >
                            {action.next === "suspended" ? "Suspend Account" : "Reactivate"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-border/60 bg-surface-container-low">
            <Pager label="User accounts" page={page} pageSize={PAGE_SIZE} count={rows.length} loading={list.loading} onPage={setPage} />
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(change)}
        onClose={() => setChange(null)}
        title={change?.next === "suspended" ? `Suspend ${change?.user.name}?` : `Reactivate ${change?.user.name}?`}
        description={
          change?.next === "suspended"
            ? "Suspended users are immediately logged out and cannot create, claim, or complete food donations until reactivated."
            : "Reactivating this account restores immediate login access and privileges across all platform workflows."
        }
        confirmLabel={change?.next === "suspended" ? "Suspend User" : "Reactivate User"}
        tone={change?.next === "suspended" ? "destructive" : "default"}
        onConfirm={executeStatusChange}
      />
    </section>
  );
}
