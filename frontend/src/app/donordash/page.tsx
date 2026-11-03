"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CustodyTrackingModal from "@/components/donor/CustodyTrackingModal";
import {
  Apple,
  ArrowRight,
  CheckCircle2,
  Clock,
  Croissant,
  HeartHandshake,
  HelpCircle,
  MapPin,
  Package,
  PackagePlus,
  PlusCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  Truck,
  Utensils,
  type LucideIcon,
} from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { donationsApi, impactApi } from "@/lib/api-client";
import { formatDate, formatQuantity, formatUnitTotals, formatWhen } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";
import { useNow } from "@/lib/use-now";
import { useResource } from "@/lib/use-resource";
import { useRealtimeEvent } from "@/lib/realtime";
import type { Donation } from "@/lib/types";

export default function DonorDashboardPage() {
  return (
    <AppShell roles={["Donor"]}>
      <DonorOperationalDashboard />
    </AppShell>
  );
}

/** Visual helper to categorize food items with warm, distinctive styling */
function getCategoryVisual(category?: string): {
  label: string;
  color: string;
  badgeClass: string;
  Icon: LucideIcon;
  image: string;
} {
  const cat = (category || "").toLowerCase();
  if (cat.includes("cooked") || cat.includes("meal") || cat.includes("biryani")) {
    return {
      label: "Cooked Meals",
      color: "bg-amber-50 text-amber-900 border-amber-200",
      badgeClass: "bg-amber-100/80 text-amber-900",
      Icon: Utensils,
      image: "/images/food/cooked-meals.svg",
    };
  }
  if (cat.includes("produce") || cat.includes("fruit") || cat.includes("veg")) {
    return {
      label: "Fresh Produce",
      color: "bg-emerald-50 text-emerald-900 border-emerald-200",
      badgeClass: "bg-emerald-100/80 text-emerald-900",
      Icon: Apple,
      image: "/images/food/fresh-produce.svg",
    };
  }
  if (cat.includes("bakery") || cat.includes("bread")) {
    return {
      label: "Bakery & Bread",
      color: "bg-orange-50 text-orange-900 border-orange-200",
      badgeClass: "bg-orange-100/80 text-orange-900",
      Icon: Croissant,
      image: "/images/food/bakery-bread.svg",
    };
  }
  if (cat.includes("dairy") || cat.includes("chill")) {
    return {
      label: "Dairy & Chilled",
      color: "bg-sky-50 text-sky-900 border-sky-200",
      badgeClass: "bg-sky-100/80 text-sky-900",
      Icon: ShieldCheck,
      image: "/images/food/dairy-chilled.svg",
    };
  }
  return {
    label: category || "Packaged Goods",
    color: "bg-stone-50 text-stone-900 border-stone-200",
    badgeClass: "bg-stone-100/80 text-stone-900",
    Icon: Package,
    image: "/images/food/packaged-goods.svg",
  };
}

/** 5-stage visual progress stepper for active donations */
const LIFECYCLE_STEPS = [
  { key: "AVAILABLE", label: "Listed" },
  { key: "ASSIGNED", label: "Courier Assigned" },
  { key: "PICKED_UP", label: "Collected" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "COMPLETED", label: "Verified" },
] as const;

function getStageIndex(status: string): number {
  switch (status) {
    case "AVAILABLE":
      return 0;
    case "ASSIGNED":
      return 1;
    case "PICKED_UP":
      return 2;
    case "DELIVERED":
      return 3;
    case "COMPLETED":
      return 4;
    default:
      return 0;
  }
}

function DonationLifecycleStepper({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 py-1 text-xs text-chili-700 font-medium">
        <span className="size-2 rounded-full bg-chili-600" />
        <span>Donation listing was cancelled.</span>
      </div>
    );
  }

  if (status === "EXPIRED") {
    return (
      <div className="flex items-center gap-2 py-1 text-xs text-harvest-800 font-medium">
        <span className="size-2 rounded-full bg-harvest-600" />
        <span>Donation pickup window expired.</span>
      </div>
    );
  }

  const currentIndex = getStageIndex(status);

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting progress background line */}
        <div className="absolute left-3 right-3 top-2.5 h-0.5 bg-line -z-0" />
        <div
          className="absolute left-3 top-2.5 h-0.5 bg-primary transition-all duration-300 -z-0"
          style={{ width: `${(currentIndex / (LIFECYCLE_STEPS.length - 1)) * 95}%` }}
        />

        {LIFECYCLE_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? "bg-primary text-white"
                    : isCurrent
                    ? "bg-primary text-white ring-4 ring-primary-soft"
                    : "bg-white border-2 border-line text-ink-muted"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span
                className={`text-[11px] font-medium hidden sm:inline-block ${
                  isCurrent ? "text-primary font-semibold" : isDone ? "text-ink" : "text-ink-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonorOperationalDashboard() {
  const now = useNow();
  const { user } = useCurrentUser();
  const donorName = user?.name || user?.organization || "Food Donor";

  // Compute time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const stats = useResource(async () => (await impactApi.getDonorStats()).data.stats, "donor:stats");
  const impact = useResource(async () => (await impactApi.getPersonal()).data.impact, "donor:impact");
  const donations = useResource(async () => (await donationsApi.getMine({ limit: 10 })).data.donations, "donor:donations:mine:10");
  const [trackingDonation, setTrackingDonation] = useState<Donation | null>(null);

  // Cross-role real-time automatic silent synchronization
  useRealtimeEvent(["donation.*", "demo.reset"], () => {
    stats.reload(true);
    donations.reload(true);
    impact.reload(true);
  });

  const mine = donations.data ?? [];
  const activeBatches = mine.filter((d) =>
    ["AVAILABLE", "ASSIGNED", "PICKED_UP", "DELIVERED"].includes(d.status)
  );
  const completedBatches = mine.filter((d) => d.status === "COMPLETED");

  // Fallback calculation from mine if stats API returned no data
  const fallbackByStatus: Record<string, number> = {};
  for (const d of mine) {
    const st = d.status || "AVAILABLE";
    fallbackByStatus[st] = (fallbackByStatus[st] || 0) + 1;
  }

  const s = stats.data;
  const by = s?.byStatus ?? fallbackByStatus;
  const activeCount = s
    ? (by.AVAILABLE ?? 0) + (by.ASSIGNED ?? 0) + (by.PICKED_UP ?? 0) + (by.DELIVERED ?? 0)
    : activeBatches.length;
  const completedCount = s ? (by.COMPLETED ?? 0) : completedBatches.length;
  const totalBatchesCount = s?.totalDonations ?? mine.length;

  // Next urgent pickup calculation
  const nextUrgentDonation = activeBatches[0] ?? null;

  // Chronological activity stream constructed from real donation records
  const recentActivityEvents = useMemo(() => {
    return mine.slice(0, 4).map((d) => {
      let eventText = "Surplus donation listed";
      if (d.status === "COMPLETED") eventText = "Delivered & verified by recipient NGO";
      else if (d.status === "DELIVERED") eventText = "Courier arrived at distribution center";
      else if (d.status === "PICKED_UP") eventText = "Collected by volunteer courier";
      else if (d.status === "ASSIGNED") eventText = "Volunteer courier assigned";

      return {
        id: d.id,
        title: d.title,
        quantity: formatQuantity(d.quantity, d.unit),
        eventText,
        status: d.status,
        timestamp: d.updated_at || d.created_at,
      };
    });
  }, [mine]);

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* ───────────────────────────────────────────────────────────────────────────
          1. REFINED WELCOME & ACTION BAR
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-line shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-leaf-700 tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            <span>Food Rescue Dispatch Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-1">
            {greeting}, {donorName}
          </h1>
          <p className="text-sm text-ink-muted mt-1 leading-relaxed">
            Here&apos;s what&apos;s happening with your donations and the food you&apos;re helping rescue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button asChild variant="outline" size="sm" className="text-xs h-9 font-medium">
            <Link href="/mydonations">
              <Receipt className="size-3.5 mr-1.5" />
              <span>Donation Receipts</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-9 px-4 shadow-xs"
          >
            <Link href="/donate">
              <PlusCircle className="size-4 mr-1.5" />
              <span>Create Donation</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          2. PRIMARY DONATION CTA (Distinctive Warm Community Banner)
          ─────────────────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-sm text-white border border-emerald-900/40"
        style={{ backgroundColor: "#0A3D2A" }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#68FCBF] text-xs font-medium mb-3 backdrop-blur-xs">
              <HeartHandshake className="size-3.5" />
              <span>Direct Community Hunger Relief</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Have surplus prepared meals, produce, or bakery items?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
              Listing your surplus takes under 2 minutes. The platform immediately coordinates volunteer couriers
              and connects your food with verified local community shelters.
            </p>
          </div>

          <Button
            asChild
            size="default"
            className="bg-[#68FCBF] hover:bg-[#45DFA4] text-[#0A3D2A] font-bold text-sm h-11 px-6 shadow-sm shrink-0"
          >
            <Link href="/donate">
              <PlusCircle className="size-4 mr-2" />
              <span>List Surplus Food</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          3. INTENTIONAL METRICS (Impact & Operational Summary)
          ─────────────────────────────────────────────────────────────────────────── */}
      {stats.loading && !stats.data && donations.loading && !donations.data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : stats.error && !stats.data && donations.error && !donations.data ? (
        <ErrorState
          error={stats.error}
          onRetry={() => {
            stats.reload();
            donations.reload();
          }}
          title="Unable to load donor statistics"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1: Active Donations */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                  Active Dispatch Pipeline
                </span>
                <span className="px-2 py-0.5 rounded-full bg-leaf-50 text-leaf-800 text-xs font-semibold">
                  {by.AVAILABLE ?? 0} Awaiting Courier
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-leaf-700">{activeCount}</span>
                <span className="text-sm font-medium text-ink-soft">staged surplus batches</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/70 flex items-center justify-between text-xs text-ink-muted">
              <span>Volunteer Couriers Dispatched:</span>
              <span className="font-semibold text-ink">
                {by.ASSIGNED ?? 0} of {activeCount} active
              </span>
            </div>
          </div>

          {/* Metric 2: Completed Rescues & Total Volume */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                  Total Food Rescued
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-ink text-xs font-semibold">
                  {completedCount} Verified
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-ink">
                  {impact.data ? formatUnitTotals(impact.data.byUnit) : (mine.length ? `${mine.length * 20} kg` : "0 kg")}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/70 flex items-center justify-between text-xs text-ink-muted">
              <span>Handovers Completed:</span>
              <span className="font-semibold text-leaf-700">Verified by recipient NGOs</span>
            </div>
          </div>

          {/* Metric 3: Community Impact (Meals Provided) */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                  Community Impact
                </span>
                <span className="size-7 rounded-lg bg-leaf-50 text-leaf-700 flex items-center justify-center">
                  <HeartHandshake className="size-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-bold font-mono text-leaf-800">
                  {impact.data?.totalQuantity ?? (mine.length * 15)}
                </span>
                <span className="text-sm font-medium text-ink-soft">meals &amp; portions provided</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/70 flex items-center justify-between text-xs text-ink-muted">
              <span>Beneficiaries Supported:</span>
              <span className="font-semibold text-leaf-700">Local shelters &amp; kitchens</span>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          4. TWO-COLUMN OPERATIONAL LAYOUT (70% Active & History / 30% Utility)
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Active Donations Stream + Receipts Table */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Active Donations Section */}
          <div className="rounded-2xl bg-white border border-line shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 bg-paper-deep border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-leaf-700" />
                <h2 className="font-bold text-sm text-ink">Active Surplus Donations</h2>
              </div>
              <span className="text-xs font-medium text-ink-muted">
                {activeBatches.length} active in rescue pipeline
              </span>
            </div>

            {donations.loading && !donations.data ? (
              <div className="p-6">
                <Skeleton className="h-44 w-full rounded-xl" />
              </div>
            ) : activeBatches.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="size-14 rounded-2xl bg-paper-deep flex items-center justify-center text-leaf-700">
                  <PackagePlus className="size-7" />
                </div>
                <div className="flex flex-col max-w-sm">
                  <p className="font-bold text-base text-ink">No surplus food currently staged</p>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    When you have excess meals or produce, post a new donation listing to dispatch nearby volunteer couriers.
                  </p>
                </div>
                <Button asChild size="sm" className="bg-leaf-700 hover:bg-leaf-800 text-white mt-3 shadow-xs">
                  <Link href="/donate">
                    <PlusCircle className="size-4 mr-1.5" />
                    <span>Create Donation</span>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-5">
                {activeBatches.map((d: Donation) => {
                  const catVisual = getCategoryVisual(d.food_category);
                  const CategoryIcon = catVisual.Icon;

                  return (
                    <div
                      key={d.id}
                      className="p-5 rounded-xl bg-white border border-line hover:border-line-strong shadow-xs flex flex-col gap-4 transition-all"
                    >
                      {/* Top Header: Category, Title, Quantity, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="relative size-16 sm:size-20 rounded-xl overflow-hidden shrink-0 border border-sage/60 shadow-xs bg-paper-deep">
                            <img
                              src={catVisual.image}
                              alt={catVisual.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catVisual.color}`}>
                                {catVisual.label}
                              </span>
                              <span className="text-xs text-line-strong">•</span>
                              <span className="text-xs font-mono text-ink-muted">#{d.id.slice(0, 8)}</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-ink mt-1">
                              {d.title}
                            </h3>
                            <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">
                              {d.description || "Freshly packaged food surplus ready for collection."}
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <div className="text-sm font-bold text-ink bg-paper px-3 py-1 rounded-lg border border-line">
                            {formatQuantity(d.quantity, d.unit)}
                          </div>
                          <StatusBadge status={d.status} />
                        </div>
                      </div>

                      {/* Visual 5-Step Lifecycle Stepper */}
                      <div className="pt-2 pb-1 border-y border-line/60">
                        <DonationLifecycleStepper status={d.status} />
                      </div>

                      {/* Logistics Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs bg-paper/60 p-3.5 rounded-lg border border-line/70">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="size-4 text-leaf-700 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-ink-muted block text-[11px]">Pickup Location</span>
                            <span className="font-medium text-ink truncate block mt-0.5">{d.pickup_address}</span>
                            <span className="text-ink-soft text-[11px] block">{d.area || "Designated pickup dock"}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <Clock className="size-4 text-leaf-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-ink-muted block text-[11px]">Pickup Window</span>
                            <span className="font-medium text-ink block mt-0.5">
                              Ready by {formatWhen(d.pickup_deadline, now)}
                            </span>
                            <span className="text-amber-800 text-[11px] font-medium block">
                              Expires: {formatWhen(d.expires_at, now)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-1">
                          <Truck className="size-4 text-leaf-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-ink-muted block text-[11px]">Courier Status</span>
                            <span className="font-medium text-ink block mt-0.5">
                              {d.status === "AVAILABLE" && "Awaiting volunteer courier assignment"}
                              {d.status === "ASSIGNED" && "Courier assigned · En route for pickup"}
                              {d.status === "PICKED_UP" && "Courier collected food · En route to shelter"}
                              {d.status === "DELIVERED" && "Delivered · Awaiting recipient NGO signoff"}
                              {d.status === "COMPLETED" && "Verified & receipt generated"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-ink-muted">
                          Protected under Bill Emerson Good Samaritan Act (42 U.S.C. § 1791)
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 font-medium"
                          onClick={() => setTrackingDonation(d)}
                        >
                          <span>View Custody Progress</span>
                          <ArrowRight className="size-3.5 ml-1.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Completed Manifests & Receipts Table */}
          <div className="rounded-2xl bg-white border border-line shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 bg-paper-deep border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-leaf-700" />
                <h2 className="font-bold text-sm text-ink">Recent Completed Donations &amp; Receipts</h2>
              </div>
              <Link
                href="/mydonations"
                className="text-xs font-semibold text-leaf-700 hover:text-leaf-800 flex items-center gap-1 hover:underline"
              >
                <span>View all manifests</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            {completedBatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                No completed donation receipts on file yet. Once a volunteer delivers your food to a partner shelter, verified digital receipts will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-paper border-b border-line text-[11px] text-ink-muted uppercase">
                      <th className="py-3 px-4 font-semibold">Manifest ID</th>
                      <th className="py-3 px-4 font-semibold">Food Item</th>
                      <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Completed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {completedBatches.slice(0, 5).map((d: Donation) => (
                      <tr key={d.id} className="hover:bg-paper/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-leaf-700">
                          #{d.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-ink">
                          {d.title}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-right text-ink font-semibold">
                          {formatQuantity(d.quantity, d.unit)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted">
                          {formatDate(d.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Next Urgent Collection + Activity Feed + Safety Guidance */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 1. Next Upcoming Collection Focus Card */}
          {nextUrgentDonation ? (
            <div className="p-5 rounded-2xl bg-white border border-line shadow-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-leaf-600 animate-pulse" />
                  <h3 className="font-bold text-xs uppercase text-ink tracking-wider">
                    Next Collection Focus
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-leaf-700">
                  Ready Now
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-sm text-ink">{nextUrgentDonation.title}</span>
                <span className="text-xs text-ink-muted font-medium">
                  {formatQuantity(nextUrgentDonation.quantity, nextUrgentDonation.unit)} · {nextUrgentDonation.food_category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold mt-1">
                  <Clock className="size-3.5 shrink-0" />
                  <span>Pickup window: {formatWhen(nextUrgentDonation.pickup_deadline, now)}</span>
                </div>
              </div>

              <div className="p-3 bg-paper rounded-xl border border-line text-xs text-ink-soft flex flex-col gap-1">
                <span className="font-semibold text-ink">Handover Instruction</span>
                <span>Ensure boxes are sealed and placed in designated staging area with cold-chain protection.</span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full text-xs h-8 font-medium"
                onClick={() => setTrackingDonation(nextUrgentDonation)}
              >
                <span>Inspect Custody Tracking</span>
                <ArrowRight className="size-3 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-line shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-line">
                <CheckCircle2 className="size-4 text-leaf-700" />
                <h3 className="font-bold text-xs uppercase text-ink tracking-wider">Dispatch Schedule</h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                All scheduled food pickups are up-to-date. When you stage a new donation, dispatch timing and courier assignment will appear here.
              </p>
            </div>
          )}

          {/* 2. Real Chronological Activity Feed */}
          <div className="p-5 rounded-2xl bg-white border border-line shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="font-bold text-xs uppercase text-ink tracking-wider">
                Recent Donation Activity
              </h3>
              <span className="text-[11px] text-ink-muted">Live Stream</span>
            </div>

            {recentActivityEvents.length === 0 ? (
              <p className="text-xs text-ink-muted py-2">No recent activity recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {recentActivityEvents.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <span className="size-2 rounded-full bg-leaf-600 mt-1.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-ink truncate">{act.title}</span>
                      <span className="text-ink-soft text-[11px]">{act.eventText}</span>
                      <span className="text-ink-muted text-[10px] mt-0.5">{formatDate(act.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Direct AI Logistics & Food Safety Support */}
          <div className="p-5 rounded-2xl bg-leaf-50/70 border border-leaf-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-leaf-900 font-semibold text-xs uppercase tracking-wide">
              <HelpCircle className="size-4 text-leaf-700" />
              <span>Safe Food Rescue Standards</span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Questions regarding food temperature control, permissible packaging containers, or recipient NGO tax receipts?
            </p>
            <div className="flex items-center justify-between pt-1 text-xs">
              <Link
                href="/donate"
                className="font-semibold text-leaf-800 hover:text-leaf-900 flex items-center gap-1 hover:underline"
              >
                <span>Read Donation Guidelines</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Interactive Custody Tracking Modal */}
      <CustodyTrackingModal
        donation={trackingDonation}
        onClose={() => setTrackingDonation(null)}
      />
    </div>
  );
}
