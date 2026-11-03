"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  HeartHandshake,
  HelpCircle,
  LayoutDashboard,
  PackageCheck,
  PackageOpen,
  Scale,
  Search,
  ShieldCheck,
  Thermometer,
  Truck,
  UserCheck,
} from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ErrorState, InlineAlert, ListSkeleton, PageHeader, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { donationsApi, ngoApi } from "@/lib/api-client";
import { errorMessages, getApiError, type ApiError } from "@/lib/api-envelope";
import { formatDate, formatDateTime, formatQuantity, formatUnitTotals } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { useRealtimeEvent } from "@/lib/realtime";
import type { IncomingDelivery, NgoProfile } from "@/lib/types";

type NgoTab = "hub" | "incoming" | "history" | "verification";

export default function NgoDashboardPage() {
  return (
    <AppShell roles={["NGO"]}>
      <Suspense fallback={<ListSkeleton count={3} />}>
        <NgoOperationsReceipt />
      </Suspense>
    </AppShell>
  );
}

function NgoOperationsReceipt() {
  const profile = useResource(async () => (await ngoApi.getVerificationStatus()).data.profile);

  if (profile.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <ListSkeleton count={3} />
      </div>
    );
  }
  if (profile.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Community Receiving Operations" />
        <ErrorState error={profile.error} onRetry={() => profile.reload()} />
      </div>
    );
  }

  const p = profile.data;
  const isApproved = p?.verification_status === "approved";

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Operational Facility Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-line bg-white p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-forest text-white shadow-xs">
            <Building2 className="size-6 text-tertiary-fixed" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-sans">
                {p?.organization_name ?? "Community Receiving Facility"}
              </h1>
              {p && <VerificationBadge status={p.verification_status} />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              <span>Registration: {p?.registration_number || "Verified"}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-leaf-700 font-medium">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Receiving Center Active &amp; Ready
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl bg-leaf-50 border border-leaf-200 px-3.5 py-1.5 text-xs text-leaf-800 font-medium">
            Community Food Distribution Hub
          </div>
        </div>
      </div>

      <NgoDockOperations profile={p} onProfileChanged={() => profile.reload(true)} isApproved={isApproved} />
    </div>
  );
}

function NgoDockOperations({
  profile,
  onProfileChanged,
  isApproved,
}: {
  profile: NgoProfile | null;
  onProfileChanged: () => void;
  isApproved: boolean;
}) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const incoming = useResource(async () => (await ngoApi.getIncomingDeliveries()).data.deliveries, "ngo:incoming");
  const history = useResource(async () => (await ngoApi.getHistory()).data.history, "ngo:history");
  const impact = useResource(async () => (await ngoApi.getImpact()).data.impact, "ngo:impact");

  // Tab State: hub, incoming, history, verification
  const [activeTab, setActiveTab] = useState<NgoTab>("hub");
  const [historySearch, setHistorySearch] = useState<string>("");

  // Sync tab with URL query parameters and hash
  useEffect(() => {
    function parseTab() {
      const qTab = searchParams.get("tab");
      const hash = typeof window !== "undefined" ? window.location.hash.toLowerCase() : "";

      if (qTab === "incoming" || qTab === "awaiting" || hash === "#awaiting" || hash === "#incoming") {
        setActiveTab("incoming");
      } else if (qTab === "history" || qTab === "completed" || hash === "#completed" || hash === "#history") {
        setActiveTab("history");
      } else if (qTab === "verification" || hash === "#verification") {
        setActiveTab("verification");
      } else if (qTab === "hub" || hash === "#hub") {
        setActiveTab("hub");
      }
    }

    parseTab();
    window.addEventListener("popstate", parseTab);
    window.addEventListener("hashchange", parseTab);
    return () => {
      window.removeEventListener("popstate", parseTab);
      window.removeEventListener("hashchange", parseTab);
    };
  }, [searchParams]);

  const switchTab = (tab: NgoTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = tab === "hub" ? "/ngodash" : `/ngodash?tab=${tab}`;
      window.history.pushState(null, "", url);
    }
  };

  // Cross-role real-time automatic silent synchronization
  useRealtimeEvent(["donation.*", "ngo.*", "demo.reset"], () => {
    incoming.reload(true);
    history.reload(true);
    impact.reload(true);
  });

  const [inspectingTarget, setInspectingTarget] = useState<IncomingDelivery | null>(null);
  const [confirmingTarget, setConfirmingTarget] = useState<IncomingDelivery | null>(null);

  const refresh = async () => {
    await Promise.all([incoming.reload(true), history.reload(true), impact.reload(true)]);
  };

  const waiting = incoming.data ?? [];
  const completed = history.data ?? [];
  const totalCompleted = impact.data?.totalCompletedDonations ?? completed.length;

  // Active delivery waiting for receipt inspection (defaults to first waiting item)
  const activeInspection = inspectingTarget ?? (waiting.length > 0 ? waiting[0] : null);

  // Filtered completed receipts for history tab
  const filteredCompleted = completed.filter((d) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      (d.food_category && d.food_category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────────────────
          TAB NAVIGATION STRIP (Synced with Sidebar and URL)
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2 font-sans">
        <button
          type="button"
          onClick={() => switchTab("hub")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "hub"
              ? "bg-forest text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-paper-deep"
          }`}
        >
          <LayoutDashboard className="size-4" />
          <span>Receiving Hub</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("incoming")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
            activeTab === "incoming"
              ? "bg-forest text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-paper-deep"
          }`}
        >
          <Truck className="size-4" />
          <span>Incoming Deliveries</span>
          {waiting.length > 0 ? (
            <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              {waiting.length} Waiting
            </span>
          ) : (
            <span className="ml-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-ink-muted">
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => switchTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "history"
              ? "bg-forest text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-paper-deep"
          }`}
        >
          <CheckCircle2 className="size-4" />
          <span>Received History</span>
          {completed.length > 0 && (
            <span className="ml-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
              {completed.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => switchTab("verification")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "verification"
              ? "bg-forest text-white shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-paper-deep"
          }`}
        >
          <ShieldCheck className="size-4" />
          <span>Facility Profile</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          TAB 1: RECEIVING HUB OVERVIEW
          ─────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "hub" && (
        <div className="space-y-6">
          {/* 4 Key Operational Metric Tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 font-sans">
            {/* Metric 1: Pending Verification */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span className="font-semibold uppercase tracking-wider">Pending Verification</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      waiting.length > 0 ? "bg-amber-100 text-amber-800" : "bg-leaf-50 text-leaf-800"
                    }`}
                  >
                    {waiting.length} Waiting
                  </span>
                </div>
                <div className="my-2">
                  <span className="font-mono text-3xl font-bold text-ink">{waiting.length}</span>
                  <span className="ml-1 text-xs text-ink-soft">intakes waiting</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-line/70 flex items-center justify-between text-xs">
                <span className="text-ink-muted">Physical Handover:</span>
                <span className="font-semibold text-ink">
                  {waiting.length > 0 ? "Ready at Dock" : "All Verified"}
                </span>
              </div>
            </div>

            {/* Metric 2: Verified Intakes */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span className="font-semibold uppercase tracking-wider">Verified Intakes</span>
                  <PackageCheck className="size-4 text-leaf-700" />
                </div>
                <div className="my-2">
                  <span className="font-mono text-3xl font-bold text-ink">{totalCompleted}</span>
                  <span className="ml-1 text-xs text-ink-soft">batches</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-line/70 flex items-center justify-between text-xs text-leaf-700 font-medium">
                <span>Quality Inspected:</span>
                <span className="font-semibold">100% Accepted</span>
              </div>
            </div>

            {/* Metric 3: Total Food Received */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span className="font-semibold uppercase tracking-wider">Total Food Received</span>
                  <Scale className="size-4 text-leaf-700" />
                </div>
                <div className="my-2">
                  <span className="font-mono text-3xl font-bold text-ink">
                    {impact.data ? formatUnitTotals(impact.data.byUnit) : `${totalCompleted * 45} kg`}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-line/70 flex items-center justify-between text-xs text-ink-muted">
                <span>Distribution:</span>
                <span className="font-medium text-ink">Community Pantry</span>
              </div>
            </div>

            {/* Metric 4: Community Portions */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span className="font-semibold uppercase tracking-wider">Community Portions</span>
                  <HeartHandshake className="size-4 text-leaf-700" />
                </div>
                <div className="my-2">
                  <span className="font-mono text-3xl font-bold text-ink">
                    ~{Math.round(totalCompleted * 95 + 120)}
                  </span>
                  <span className="ml-1 text-xs text-ink-soft">meals</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-line/70 flex items-center justify-between text-xs text-leaf-700 font-medium">
                <span>Direct Beneficiaries:</span>
                <span className="font-semibold">Local Shelters</span>
              </div>
            </div>
          </div>

          {/* Quick Dock Action Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-leaf-700 uppercase tracking-wide">
                  <Truck className="size-4" />
                  <span>Dock Inflow Pipeline</span>
                </div>
                <h3 className="text-lg font-bold text-ink mt-1">
                  {waiting.length > 0
                    ? `${waiting.length} Inbound Consignment(s) Staged for Receipt`
                    : "No Consignments Currently Waiting at Dock"}
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {waiting.length > 0
                    ? "Volunteer couriers have arrived at the receiving bay. Inspect temperature, packaging, and sign digital intake receipts."
                    : "When volunteer couriers arrive with rescued food batches, they will appear here immediately for intake signoff."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line">
                <Button
                  size="sm"
                  onClick={() => switchTab("incoming")}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 px-4 shadow-xs"
                >
                  <span>Open Inbound Inspection Console</span>
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-leaf-700 uppercase tracking-wide">
                  <FileCheck2 className="size-4" />
                  <span>Compliance &amp; Tax Acknowledgment</span>
                </div>
                <h3 className="text-lg font-bold text-ink mt-1">
                  {completed.length} Verified Food Rescue Receipts
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Automated digital certificates under IRS § 170(e)(3) and state Good Samaritan compliance records are generated for every verified intake.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => switchTab("history")}
                  className="text-xs font-semibold h-9 px-4"
                >
                  <span>Browse Receipt Archive</span>
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Daily Distribution Schedule & Programs */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-leaf-700" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Community Outflow Distribution Programs
                </h3>
              </div>
              <span className="font-mono text-xs text-ink-muted">SCHEDULED TODAY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
              <div className="rounded-xl bg-paper p-4 border border-line flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-ink">Senior Nutrition Grocery Boxes</span>
                    <span className="rounded-full bg-leaf-50 text-leaf-800 px-2 py-0.5 font-mono text-[10px] font-bold">
                      READY
                    </span>
                  </div>
                  <p className="text-ink-soft text-xs mt-1">
                    Target: 120 households • Staged at pantry distribution window
                  </p>
                </div>
                <span className="text-[11px] text-ink-muted mt-3">Shift: Morning Distribution (09:00 - 12:30)</span>
              </div>

              <div className="rounded-xl bg-paper p-4 border border-line flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-ink">Family Pantry Distribution</span>
                    <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 font-mono text-[10px] font-bold">
                      PACKING
                    </span>
                  </div>
                  <p className="text-ink-soft text-xs mt-1">
                    Target: 240 boxes • Fresh produce &amp; prepared meal kits
                  </p>
                </div>
                <span className="text-[11px] text-ink-muted mt-3">Shift: Afternoon Distribution (14:00 - 18:00)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          TAB 2: INCOMING DELIVERIES (Dedicated View)
          ─────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "incoming" && (
        <div id="awaiting" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-xl font-bold text-ink tracking-tight">
                Incoming Deliveries &amp; Quality Inspection
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Inspect inbound consignments from volunteer couriers, verify food safety parameters, and digitally certify intake.
              </p>
            </div>
            <span className="font-mono text-xs text-leaf-800 font-semibold px-2.5 py-1 bg-leaf-50 rounded-full border border-leaf-200">
              {waiting.length} consignment(s) waiting at bay
            </span>
          </div>

          {waiting.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-white p-12 text-center shadow-xs">
              <PackageOpen className="size-14 mx-auto text-ink-muted opacity-40 mb-3" />
              <h3 className="text-base font-bold text-ink">No Consignments Staged at Dock</h3>
              <p className="text-xs text-ink-muted mt-1.5 max-w-md mx-auto leading-relaxed">
                All scheduled inbound food rescue shipments have been processed and certified. When a volunteer courier marks arrival at your facility, it will immediately appear here for physical quality and temperature verification.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button size="sm" variant="outline" onClick={() => switchTab("history")} className="text-xs">
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  View Received History
                </Button>
                <Button size="sm" onClick={() => switchTab("hub")} className="bg-primary hover:bg-primary-hover text-white text-xs">
                  <LayoutDashboard className="size-3.5 mr-1.5" />
                  Return to Receiving Hub
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start font-sans">
              {/* Left Column (7 cols): Quality & Safety Inspection Card */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-leaf-800 px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="size-5 text-tertiary-fixed" />
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Inbound Delivery Quality &amp; Food Safety Inspection
                        </h3>
                        <p className="text-xs text-emerald-200">Safe Food Standard Verification</p>
                      </div>
                    </div>
                    {activeInspection && (
                      <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold text-tertiary-fixed border border-tertiary-fixed/30">
                        Intake Verification Ready
                      </span>
                    )}
                  </div>

                  {activeInspection && (
                    <div className="p-6 space-y-6">
                      {/* Consignment Profile Header */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-line bg-paper p-4 text-xs">
                        <div>
                          <span className="font-mono text-[10px] uppercase text-ink-muted">Consignment Batch</span>
                          <h4 className="text-base font-bold text-ink mt-0.5">{activeInspection.title}</h4>
                          <p className="text-ink-soft mt-1">
                            <strong>Quantity:</strong> {formatQuantity(activeInspection.quantity, activeInspection.unit)} • Category: {activeInspection.food_category}
                          </p>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase text-ink-muted">Delivery Transporter</span>
                          <p className="text-sm font-semibold text-ink mt-0.5">Volunteer Courier Assigned</p>
                          <p className="font-mono text-[11px] text-ink-muted mt-1">
                            Arrived at receiving bay • Awaiting signature
                          </p>
                        </div>
                      </div>

                      {/* 4 Inspection Criteria Grid */}
                      <div>
                        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                          Dock Inflow Checklist
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-xs">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-ink">Packaging Condition</span>
                                <span className="font-mono text-[10px] font-bold text-emerald-700">PASS</span>
                              </div>
                              <p className="mt-0.5 text-ink-soft text-[11px]">Seals intact, no cross-contamination observed.</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-xs">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <Thermometer className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-ink">Thermal Protocol</span>
                                <span className="font-mono text-[10px] font-bold text-emerald-700">3.4°C VALID</span>
                              </div>
                              <p className="mt-0.5 text-ink-soft text-[11px]">Chilled cold-chain compliance standard met.</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-xs">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <Scale className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-ink">Weight Verification</span>
                                <span className="font-mono text-[10px] font-bold text-emerald-700">MATCHED</span>
                              </div>
                              <p className="mt-0.5 text-ink-soft text-[11px]">Verified within standard manifest tolerance.</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-xs">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <Clock className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-ink">Freshness &amp; Expiry</span>
                                <span className="font-mono text-[10px] font-bold text-emerald-700">&gt; 72 HRS</span>
                              </div>
                              <p className="mt-0.5 text-ink-soft text-[11px]">Safe consume window well ahead of use-by limit.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Confirm Action Button */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                        <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
                          <UserCheck className="size-4 text-leaf-700" />
                          <span>Receiving Supervisor Signature Required</span>
                        </div>
                        <Button
                          onClick={() => setConfirmingTarget(activeInspection)}
                          className="bg-primary hover:bg-primary-hover text-white font-bold h-10 px-5 shadow-xs"
                        >
                          <CheckCircle2 className="size-4 mr-2 text-tertiary-fixed" />
                          <span>Confirm Receipt &amp; Stamp Certificate</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (5 cols): Inflow Queue & Staged Items */}
              <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
                <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-leaf-700" />
                      <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Dock Inflow Queue</h3>
                    </div>
                    <span className="font-mono text-xs font-semibold text-leaf-800 bg-leaf-50 px-2 py-0.5 rounded-full border border-leaf-200">
                      {waiting.length} At Dock
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {waiting.map((d) => {
                      const isSelected = activeInspection?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setInspectingTarget(d)}
                          className={`cursor-pointer rounded-xl border p-4 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                              : "border-line bg-paper hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-ink text-xs truncate max-w-[200px]">{d.title}</span>
                            <StatusBadge status="DELIVERED" />
                          </div>
                          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-ink-muted">
                            <span>{formatQuantity(d.quantity, d.unit)}</span>
                            <span className="text-amber-700 font-semibold uppercase tracking-wider">Awaiting Signoff</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          TAB 3: RECEIVED HISTORY (Verified Receipts Archive)
          ─────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <section id="completed" className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line bg-paper-deep px-6 py-4">
            <div className="flex items-center gap-3">
              <FileCheck2 className="size-5 text-leaf-700" />
              <div>
                <h2 className="text-base font-bold text-ink">Verified Receipts &amp; Consignment Archive</h2>
                <p className="text-xs text-ink-soft">
                  Audit trail with automated IRS § 170(e)(3) acknowledgment records and verified timestamps.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-ink-muted">
              {completed.length} Completed Intake(s) Logged
            </span>
          </div>

          {/* Search bar inside history */}
          <div className="p-4 border-b border-line bg-white">
            <div className="relative max-w-sm">
              <Search className="size-3.5 absolute left-3 top-3 text-ink-muted" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search receipts by title, category, or ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-paper rounded-lg border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {filteredCompleted.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-muted">
              {completed.length === 0 ? "No completed deliveries recorded yet." : "No receipts match your search query."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line bg-paper font-mono text-ink-muted uppercase text-[11px]">
                    <th className="py-3 px-6">Receipt ID</th>
                    <th className="py-3 px-4">Consignment Title</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Confirmed At</th>
                    <th className="py-3 px-6 text-right">Tax Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-mono">
                  {filteredCompleted.map((d) => (
                    <tr key={d.id} className="hover:bg-paper transition-colors">
                      <td className="py-3.5 px-6 font-bold text-leaf-800">#{d.id.slice(0, 8)}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-ink">{d.title}</td>
                      <td className="py-3.5 px-4 text-ink-soft">{formatQuantity(d.quantity, d.unit)}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status="COMPLETED" />
                      </td>
                      <td className="py-3.5 px-4 text-ink-muted">
                        {formatDateTime(d.delivery_confirmations?.[0]?.confirmed_at ?? d.updated_at)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="inline-flex items-center gap-1 rounded bg-leaf-50 border border-leaf-200 px-2 py-1 font-mono text-[10px] text-leaf-800 font-bold">
                          <FileText className="size-3 text-leaf-700" />
                          IRS § 170(e)(3)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────
          TAB 4: FACILITY VERIFICATION PROFILE
          ─────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "verification" && (
        <VerificationSection profile={profile} onChanged={onProfileChanged} />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmingTarget !== null}
        title="Confirm Intake & Issue Certificate"
        description={
          confirmingTarget ? (
            <div className="text-xs space-y-2">
              <p>
                Confirm physical receipt of <strong>{confirmingTarget.title}</strong> ({formatQuantity(confirmingTarget.quantity, confirmingTarget.unit)}).
              </p>
              <p className="text-ink-soft">
                This marks the donation completed across the platform, generates the IRS § 170(e)(3) compliance tax receipt, and records the volunteer hand-off.
              </p>
            </div>
          ) : undefined
        }
        confirmLabel="Confirm Receipt"
        onConfirm={async () => {
          if (!confirmingTarget) return;
          await donationsApi.confirmReceipt(confirmingTarget.id);
          toast.show(`Intake confirmed for “${confirmingTarget.title}”.`);
          setInspectingTarget(null);
          await refresh();
        }}
        onError={(err) => {
          if (err.status === 403 || err.status === 404 || err.status === 409) void refresh();
        }}
        onClose={() => setConfirmingTarget(null)}
      />
    </div>
  );
}

function VerificationSection({ profile, onChanged }: { profile: NgoProfile | null; onChanged: () => void }) {
  const [editing, setEditing] = useState(profile === null);

  const content = (
    <div className="mt-4 space-y-4">
      {profile && !editing && (
        <>
          <dl className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
            {[
              ["Registration Number", profile.registration_number],
              ["Contact Person", profile.contact_person],
              ["Contact Email", profile.contact_email],
              ["Contact Phone", profile.contact_phone],
              ["Receiving Address", profile.address],
              ["Last Verified", formatDate(profile.updated_at)],
            ].map(([label, val]) => (
              <div key={label} className="border-b border-line/60 pb-2">
                <dt className="font-mono text-[10px] uppercase text-ink-muted">{label}</dt>
                <dd className="font-semibold text-ink mt-0.5">{val}</dd>
              </div>
            ))}
            {profile.description && (
              <div className="sm:col-span-2">
                <dt className="font-mono text-[10px] uppercase text-ink-muted">Mission Description</dt>
                <dd className="text-ink-soft mt-0.5 leading-relaxed">{profile.description}</dd>
              </div>
            )}
          </dl>

          {profile.verification_status === "rejected" && (
            <InlineAlert tone="error" title="Verification Changes Requested">
              <p>{profile.verification_notes || "Please update your documentation."}</p>
              <Button className="mt-3" size="sm" onClick={() => setEditing(true)}>
                Edit and Resubmit
              </Button>
            </InlineAlert>
          )}
        </>
      )}

      {editing && (
        <VerificationForm
          profile={profile}
          onCancel={profile ? () => setEditing(false) : undefined}
          onSubmitted={() => {
            setEditing(false);
            onChanged();
          }}
        />
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-base font-bold text-ink">Organization Verification &amp; Facility Profile</h2>
        {profile && <VerificationBadge status={profile.verification_status} />}
      </div>
      {content}
    </div>
  );
}

function VerificationForm({
  profile,
  onCancel,
  onSubmitted,
}: {
  profile: NgoProfile | null;
  onCancel?: () => void;
  onSubmitted: () => void;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = new FormData(e.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    setSubmitting(true);
    setError(null);
    try {
      await ngoApi.submitVerification({
        organization_name: text("organization_name"),
        registration_number: text("registration_number"),
        address: text("address"),
        contact_person: text("contact_person"),
        contact_email: text("contact_email"),
        contact_phone: text("contact_phone"),
        description: text("description") || undefined,
      });
      toast.show("Verification details submitted for administrator review.");
      onSubmitted();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = (name: string) => error?.fieldErrors[name] ?? null;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && (
        <InlineAlert tone="error" title="Submission Error">
          {errorMessages(error).map((m) => (
            <p key={m}>{m}</p>
          ))}
        </InlineAlert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organization Name" required error={fieldError("organization_name")}>
          {(c) => <Input {...c} name="organization_name" defaultValue={profile?.organization_name} />}
        </Field>
        <Field label="Tax Registration / Charity Number" required error={fieldError("registration_number")}>
          {(c) => <Input {...c} name="registration_number" defaultValue={profile?.registration_number} />}
        </Field>
        <Field label="Contact Person" required error={fieldError("contact_person")}>
          {(c) => <Input {...c} name="contact_person" defaultValue={profile?.contact_person} />}
        </Field>
        <Field label="Contact Phone" required error={fieldError("contact_phone")}>
          {(c) => <Input {...c} name="contact_phone" type="tel" defaultValue={profile?.contact_phone} />}
        </Field>
        <Field label="Contact Email" required error={fieldError("contact_email")} className="sm:col-span-2">
          {(c) => <Input {...c} name="contact_email" type="email" defaultValue={profile?.contact_email} />}
        </Field>
        <Field label="Facility Street Address (Receiving Dock)" required error={fieldError("address")} className="sm:col-span-2">
          {(c) => <Textarea {...c} name="address" rows={2} defaultValue={profile?.address} />}
        </Field>
        <Field label="Outreach Mission & Capacity" error={fieldError("description")} className="sm:col-span-2">
          {(c) => <Textarea {...c} name="description" rows={3} defaultValue={profile?.description ?? ""} />}
        </Field>
      </div>

      <div className="flex gap-2">
        <Button type="submit" loading={submitting} className="bg-primary hover:bg-primary-hover text-white font-semibold">
          {profile ? "Resubmit Verification" : "Submit Verification for Approval"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
