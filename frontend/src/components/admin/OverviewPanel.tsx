"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { adminApi } from "@/lib/api-client";
import { formatUnitTotals, formatWhen } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { useRealtimeEvent } from "@/lib/realtime";
import { useToast } from "@/components/ui/toast";

export default function OverviewPanel({
  onOpenVerifications,
}: {
  onOpenVerifications: () => void;
  onOpenDonations?: () => void;
}) {
  const toast = useToast();
  const [sweeping, setSweeping] = useState(false);

  // Load real operational data in parallel
  const impact = useResource(async () => (await adminApi.getImpact()).data.impact, "admin:overview:impact");
  const pendingVerifs = useResource(
    async () => (await adminApi.getVerifications({ status: "pending", limit: 50 })).data.verifications,
    "admin:overview:verifs"
  );
  const recentDonations = useResource(
    async () => (await adminApi.getDonations({ limit: 6 })).data.donations,
    "admin:overview:donations"
  );

  // Real-time multi-role sync
  useRealtimeEvent(["donation.*", "ngo.*", "demo.reset"], () => {
    impact.reload(true);
    pendingVerifs.reload(true);
    recentDonations.reload(true);
  });

  const pendingCount = pendingVerifs.data?.length ?? 0;
  const donations = recentDonations.data ?? [];
  const activeCount = donations.filter((d) => ["ASSIGNED", "PICKED_UP"].includes(d.status)).length;
  const availableCount = donations.filter((d) => d.status === "AVAILABLE").length;

  async function handleSweepExpired() {
    setSweeping(true);
    try {
      await adminApi.processExpired();
      toast.show("Expiry audit sweep completed.");
      void recentDonations.reload();
      void impact.reload();
    } catch {
      toast.show("Could not trigger sweep. Check server connectivity.");
    } finally {
      setSweeping(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ───────────────────────────────────────────────────────────────────────────
          1. HIGH-PRIORITY ALERT BANNER (Immediate Attention Required)
          ─────────────────────────────────────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-lg bg-[#BA1A1A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="size-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#93000A]">
                  Immediate Administrative Attention
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#BA1A1A] text-white text-xs font-bold">
                  {pendingCount} Pending
                </span>
              </div>
              <p className="text-xs text-[#93000A]/90 mt-0.5 leading-relaxed">
                {pendingCount} non-profit documentation verification{pendingCount === 1 ? "" : "s"} awaiting approval before they can receive emergency food donations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <Button
              onClick={onOpenVerifications}
              size="sm"
              className="bg-[#BA1A1A] hover:bg-[#93000A] text-white font-semibold shadow-xs"
            >
              <ShieldCheck className="size-4" />
              <span>Review NGO Queue</span>
            </Button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          2. OPERATIONAL HEADER & RAPID ACTIONS
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#0B1C30]">
              Platform Operations Overview
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-xs font-semibold flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Live Network
            </span>
          </div>
          <p className="text-xs text-[#404942]">
            Real-time oversight of food rescues, logistics assignments, NGO vetting, and delivery confirmations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSweepExpired}
            disabled={sweeping}
            className="text-xs font-medium"
          >
            <RefreshCw className={`size-3.5 ${sweeping ? "animate-spin" : ""}`} />
            <span>{sweeping ? "Auditing…" : "Audit Expiry"}</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenVerifications}
            className="bg-[#0F5132] hover:bg-[#0A3D2A] text-white text-xs font-semibold"
          >
            <Building2 className="size-3.5" />
            <span>Verify NGOs ({pendingCount})</span>
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          3. 4 ADMINISTRATIVE KPI CARDS
          ─────────────────────────────────────────────────────────────────────────── */}
      {impact.loading && !impact.data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : impact.error && !impact.data ? (
        <ErrorState error={impact.error} onRetry={() => impact.reload()} title="Unable to load impact metrics" />
      ) : impact.data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Completed Donations */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-mono uppercase text-[#707971] tracking-wider">Total Completed</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono text-[#0B1C30]">
                    {impact.data.totalCompletedDonations}
                  </span>
                  <span className="text-xs text-[#404942]">rescues</span>
                </div>
              </div>
              <div className="size-9 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#0F5132]">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#0F5132] font-semibold flex items-center gap-1">
                <TrendingUp className="size-3.5" /> Verified
              </span>
              <span className="font-mono text-[#404942]">
                {formatUnitTotals(impact.data.byUnit)}
              </span>
            </div>
          </div>

          {/* Available Donations */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-mono uppercase text-[#707971] tracking-wider">Available Batches</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono text-[#0B1C30]">
                    {availableCount}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] font-mono font-semibold">
                    Open
                  </span>
                </div>
              </div>
              <div className="size-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-[#065F46]">
                <Package className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#404942]">Awaiting courier claim</span>
              <span className="text-xs font-mono text-[#0F5132]">Active Feed</span>
            </div>
          </div>

          {/* Active Logistics Courier Missions */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-mono uppercase text-[#707971] tracking-wider">Active Missions</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono text-[#0B1C30]">
                    {activeCount}
                  </span>
                  <span className="text-xs text-[#3730A3] font-mono font-semibold">In Transit</span>
                </div>
              </div>
              <div className="size-9 rounded-lg bg-[#DAE2FD] flex items-center justify-center text-[#3730A3]">
                <Truck className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#404942]">Assigned volunteers</span>
              <span className="font-mono text-[#0B1C30] font-semibold">{impact.data.activeVolunteers} Couriers</span>
            </div>
          </div>

          {/* Verified Partner Community Network */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-mono uppercase text-[#707971] tracking-wider">Approved NGOs</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono text-[#0B1C30]">
                    {impact.data.approvedNGOs}
                  </span>
                  <span className="text-xs text-[#404942]">certified hubs</span>
                </div>
              </div>
              <div className="size-9 rounded-lg bg-[#D3E4FE] flex items-center justify-center text-[#0F5132]">
                <Building2 className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#404942]">Active Donors</span>
              <span className="font-mono text-[#0F5132] font-semibold">{impact.data.activeDonors} Partners</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* ───────────────────────────────────────────────────────────────────────────
          4. LIVE DISPATCH & OPERATIONS FEED TABLE
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 bg-[#EFF4FF] border-b border-[#CBD5E1]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-[#0F5132]" />
            <h3 className="font-bold text-sm text-[#0B1C30]">Recent Dispatch Stream & Custody Audit</h3>
          </div>
          <span className="text-xs font-mono text-[#707971]">
            Displaying latest {donations.length} system donation records
          </span>
        </div>

        {recentDonations.loading && !recentDonations.data ? (
          <div className="p-6">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : donations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#707971]">
            No donation records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F9FF] border-b border-[#E2E8F0] font-mono text-[11px] text-[#707971] uppercase">
                  <th className="py-3 px-4 font-semibold">Donation ID</th>
                  <th className="py-3 px-4 font-semibold">Food Batch</th>
                  <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-sans">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8F9FF] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F5132]">
                      #{d.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0B1C30]">
                      {d.title}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-right text-[#0B1C30]">
                      {d.quantity} {d.unit}
                    </td>
                    <td className="py-3 px-4 text-[#404942]">
                      {d.food_category}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[#707971]">
                      {formatWhen(d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
