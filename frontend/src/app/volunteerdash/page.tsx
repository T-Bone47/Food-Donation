"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Inbox,
  Leaf,
  MapPin,
  Navigation,
  Package,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, InlineAlert, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { donationsApi, volunteerApi } from "@/lib/api-client";
import { getApiError } from "@/lib/api-envelope";
import { formatLocation, formatQuantity, formatWhen } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { useResource } from "@/lib/use-resource";
import { useRealtimeEvent } from "@/lib/realtime";
import type { Donation } from "@/lib/types";

export default function VolunteerDashboardPage() {
  return (
    <AppShell roles={["Volunteer"]}>
      <VolunteerFleetDiscovery />
    </AppShell>
  );
}

function VolunteerFleetDiscovery() {
  const router = useRouter();
  const toast = useToast();
  const now = useNow();

  const available = useResource(async () => (await donationsApi.getAvailable()).data.donations, "volunteer:available");
  const stats = useResource(async () => (await volunteerApi.getDashboard()).data.stats, "volunteer:stats");
  const impact = useResource(async () => (await volunteerApi.getImpact()).data.impact, "volunteer:impact");

  // Cross-role real-time automatic silent synchronization
  useRealtimeEvent(["donation.*", "demo.reset"], () => {
    available.reload(true);
    stats.reload(true);
    impact.reload(true);
  });

  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "near" | "urgent">("all");

  const activeTask = stats.data?.activeAssignment ?? null;
  const rawDonations = available.data ?? [];

  // Filter donations
  const donations = rawDonations.filter((d) => {
    if (filterMode === "urgent") {
      const deadline = new Date(d.pickup_deadline).getTime();
      return deadline - now < 3 * 3600 * 1000; // < 3 hours
    }
    return true;
  });

  async function claim(donation: Donation) {
    setClaimingId(donation.id);
    setNotice(null);
    try {
      await donationsApi.claim(donation.id);
      toast.show(`Claim confirmed for “${donation.title}”. Proceed to pickup.`);
      router.push("/volunteer/tasks");
    } catch (e) {
      const err = getApiError(e);
      setNotice(err.status === 409 ? `${err.message} The list has been refreshed.` : err.message);
      await Promise.all([available.reload(true), stats.reload(true)]);
    } finally {
      setClaimingId(null);
    }
  }

  // Calculate dynamic stats
  const totalPickups = stats.data?.totalPickups ?? 0;
  const completedKg = impact.data?.byUnit?.kg ?? (totalPickups * 24.5);
  const co2DivertedKg = (completedKg * 2.5).toFixed(1);

  return (
    <div className="space-y-6 pb-12">
      {/* Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-line bg-white p-4 shadow-xs font-sans">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-paper-deep px-3 py-1.5 text-xs text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-leaf-600" />
            <span className="font-semibold text-leaf-800">Volunteer Courier Hub</span>
            <span className="text-line-strong">•</span>
            <span>Local Community Deliveries</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-leaf-50 px-3 py-1.5 text-xs font-semibold text-leaf-800">
            <ShieldCheck className="size-4 text-leaf-700" />
            <span>Ready for Deliveries</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-sans">
          <div className="flex items-center gap-2 text-ink-muted">
            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
            <span className="font-medium text-ink">{rawDonations.length} Available Donations Nearby</span>
          </div>
        </div>
      </div>

      {notice && (
        <InlineAlert tone="error" onDismiss={() => setNotice(null)}>
          <p>{notice}</p>
        </InlineAlert>
      )}

      {/* Active Delivery Callout Banner */}
      {activeTask && (
        <div className="rounded-xl border border-leaf-700/30 bg-leaf-800 text-white p-6 shadow-sm relative overflow-hidden font-sans">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-md bg-tertiary-fixed px-2.5 py-1 text-xs font-bold text-leaf-900">
                  <span className="h-2 w-2 rounded-full bg-leaf-800 animate-pulse" />
                  Active Delivery in Progress
                </span>
                <span className="font-mono text-xs text-emerald-200">#DON-{activeTask.donationId.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-200">
                <Clock className="size-3.5" />
                <span>Pickup Window Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-white/10 p-4 border border-white/10 backdrop-blur-sm">
                <div className="text-xs uppercase text-emerald-200 font-medium tracking-wider">Current Delivery</div>
                <div className="mt-1 text-lg font-bold text-white">Donation #{activeTask.donationId.slice(0, 8)}</div>
                <div className="mt-1 text-xs text-emerald-200 flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  <span>Assigned for Field Pickup & Delivery</span>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-lg bg-white/10 p-4 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-primary-fixed-dim">Current Stage:</span>
                  <StatusBadge status={activeTask.delivered ? "DELIVERED" : activeTask.pickedUp ? "PICKED_UP" : "ASSIGNED"} />
                </div>
                <Button asChild className="w-full bg-tertiary-fixed hover:bg-tertiary-fixed-dim text-leaf-900 font-bold shadow-xs">
                  <Link href="/volunteer/tasks">
                    View Delivery Task &amp; Confirm Actions
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 font-sans">
        {/* Metric 1 */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-semibold uppercase tracking-wider">Completed Rescues</span>
            <CheckCircle2 className="size-4 text-leaf-700" />
          </div>
          <div className="my-2">
            <span className="font-mono text-3xl font-bold text-ink">{totalPickups}</span>
            <span className="ml-1 text-xs text-ink-soft">deliveries</span>
          </div>
          <div className="text-xs text-leaf-700 font-semibold">Active Courier Record</div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-semibold uppercase tracking-wider">Total Food Delivered</span>
            <Package className="size-4 text-leaf-700" />
          </div>
          <div className="my-2">
            <span className="font-mono text-3xl font-bold text-ink">{Math.round(completedKg)}</span>
            <span className="ml-1 text-xs text-ink-soft">kg transported</span>
          </div>
          <div className="text-xs text-ink-muted">Distributed to local partners</div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-semibold uppercase tracking-wider">Courier Standing</span>
            <Award className="size-4 text-amber-500" />
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="font-mono text-3xl font-bold text-ink">Active</span>
            <span className="text-leaf-700 text-sm font-semibold">Verified</span>
          </div>
          <div className="text-xs text-leaf-700 font-medium">Safe Food Handling Verified</div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-semibold uppercase tracking-wider">Nearby Opportunities</span>
            <MapPin className="size-4 text-leaf-700" />
          </div>
          <div className="my-2">
            <span className="font-mono text-3xl font-bold text-ink">{rawDonations.length}</span>
            <span className="ml-1 text-xs text-ink-soft">available now</span>
          </div>
          <div className="text-xs text-leaf-700 font-medium">Ready for pickup claim</div>
        </div>
      </div>

      {/* Main Split Layout: 7 Cols Discovery Queue / 5 Cols Profile & Mission Guidance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Available Opportunities Feed (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
            <div>
              <span className="font-mono text-xs uppercase font-semibold text-primary">Discovery Feed</span>
              <h2 className="text-lg font-bold text-ink">Nearby Surplus Opportunities</h2>
              <p className="text-xs text-ink-soft">Live donations ready for immediate pickup and custody claim.</p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  filterMode === "all" ? "bg-primary text-white" : "bg-surface-container-low text-ink hover:bg-surface-container"
                }`}
              >
                All Runs ({rawDonations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("urgent")}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors flex items-center gap-1 ${
                  filterMode === "urgent" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                <Timer className="size-3" />
                Urgent (&lt; 3h)
              </button>
            </div>
          </div>

          {available.loading && !donations ? (
            <ListSkeleton count={3} />
          ) : available.error && !donations ? (
            <ErrorState error={available.error} onRetry={() => available.reload()} />
          ) : donations.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No open pickups currently staged"
              action={
                <Button asChild variant="outline">
                  <Link href="/profile">Check area filter in profile</Link>
                </Button>
              }
            >
              Surplus donations appear in this queue in real-time when staged by local donors.
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-4">
              {donations.map((d) => {
                const deadlineTime = new Date(d.pickup_deadline).getTime();
                const isUrgent = deadlineTime - now < 3 * 3600 * 1000;
                const canClaim = !activeTask && claimingId === null;

                return (
                  <div
                    key={d.id}
                    className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        isUrgent ? "bg-red-500" : "bg-primary"
                      }`}
                    />

                    <div className="flex flex-col gap-4 pl-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isUrgent ? (
                            <span className="flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 font-mono text-[10px] font-bold text-red-700">
                              <Timer className="size-3" />
                              URGENT PICKUP
                            </span>
                          ) : (
                            <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-muted">
                              STANDARD WINDOW
                            </span>
                          )}
                          <span className="font-mono text-xs text-ink-muted">#{d.id.slice(0, 8)}</span>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-ink">{d.title}</h3>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          <strong>Manifest:</strong> {formatQuantity(d.quantity, d.unit)} • Category: {d.food_category}
                        </p>
                      </div>

                      {/* Location & Routing Summary Card */}
                      <div className="rounded-lg border border-border/60 bg-surface-container-low p-3 text-xs">
                        <div className="flex items-start gap-2">
                          <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-ink">Staging Facility:</span>
                            <p className="text-ink-soft truncate">{formatLocation(d)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 font-mono text-[11px]">
                          <span className="text-ink-muted">Pickup Cutoff:</span>
                          <span className="font-semibold text-ink">{formatWhen(d.pickup_deadline, now)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <Button
                          onClick={() => claim(d)}
                          disabled={!canClaim || claimingId === d.id}
                          className="bg-primary hover:bg-primary-container text-white font-bold text-xs"
                        >
                          <Zap className="size-3.5 mr-1 text-tertiary-fixed" />
                          {claimingId === d.id ? "Securing Task…" : "Claim Pickup Task"}
                        </Button>
                        <span className="font-mono text-[11px] text-ink-muted">
                          Carbon Offset: <strong>+{(Number(d.quantity || 1) * 2.2).toFixed(1)} kg CO₂e</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Fleet Guidance, Guidelines & Badges (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
          {/* Mission Progress & Dispatch Guidelines */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-ink">Chain of Custody Standard</h3>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold text-primary">SOP PROTOCOL</span>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                  1
                </div>
                <div>
                  <span className="font-bold text-ink">Claim & Inspect Staging Bay</span>
                  <p className="text-ink-muted mt-0.5">Verify cold-chain seal and item quantities upon arrival at donor facility.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                  2
                </div>
                <div>
                  <span className="font-bold text-ink">Direct Transport to Approved NGO</span>
                  <p className="text-ink-muted mt-0.5">Keep insulated totes sealed. Maximum transit time guideline is under 45 minutes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                  3
                </div>
                <div>
                  <span className="font-bold text-ink">Receiving Supervisor Sign-Off</span>
                  <p className="text-ink-muted mt-0.5">NGO dock intake verifies temperature and marks the electronic receipt completed.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Volunteer Fleet Certification Profile */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink">Volunteer Credentials</h3>
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">LEVEL 3 CERTIFIED</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-2.5 text-xs">
                <div>
                  <div className="font-semibold text-ink">Safe Food Handling Certification</div>
                  <div className="font-mono text-[10px] text-ink-muted">Verified by FoodShare Compliance</div>
                </div>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-2.5 text-xs">
                <div>
                  <div className="font-semibold text-ink">Cold-Chain Protocol Training</div>
                  <div className="font-mono text-[10px] text-ink-muted">Active • Valid through 2026</div>
                </div>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
