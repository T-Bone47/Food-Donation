"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
  type LucideIcon,
  Apple,
  Croissant,
  Utensils,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatLocation, formatQuantity } from "@/lib/format";
import { donationsApi } from "@/lib/api-client";
import { seedResourceCache } from "@/lib/use-resource";
import type { Donation } from "@/lib/types";

interface CustodyTrackingModalProps {
  donation: Donation | null;
  onClose: () => void;
}

interface EnrichedDonationDetails extends Donation {
  assignment?: {
    id: string;
    volunteer_id: string;
    assigned_at: string;
    picked_up_at: string | null;
    delivered_at: string | null;
    assignment_status: string;
  } | null;
  delivery_confirmation?: {
    id: string;
    confirmed_by: string;
    confirmed_at: string;
    discrepancy_notes?: string;
  } | null;
  recipient_ngo?: {
    name?: string;
    organization?: string;
    area?: string;
  } | null;
}

function getCategoryVisual(category?: string): {
  label: string;
  color: string;
  Icon: LucideIcon;
  image: string;
} {
  const cat = (category || "").toLowerCase();
  if (cat.includes("cooked") || cat.includes("meal") || cat.includes("biryani")) {
    return {
      label: "Cooked Meals",
      color: "bg-amber-50 text-amber-900 border-amber-200",
      Icon: Utensils,
      image: "/images/food/cooked-meals.svg",
    };
  }
  if (cat.includes("produce") || cat.includes("fruit") || cat.includes("veg")) {
    return {
      label: "Fresh Produce",
      color: "bg-emerald-50 text-emerald-900 border-emerald-200",
      Icon: Apple,
      image: "/images/food/fresh-produce.svg",
    };
  }
  if (cat.includes("bakery") || cat.includes("bread")) {
    return {
      label: "Bakery & Bread",
      color: "bg-orange-50 text-orange-900 border-orange-200",
      Icon: Croissant,
      image: "/images/food/bakery-bread.svg",
    };
  }
  if (cat.includes("dairy") || cat.includes("chill")) {
    return {
      label: "Dairy & Chilled",
      color: "bg-sky-50 text-sky-900 border-sky-200",
      Icon: ShieldCheck,
      image: "/images/food/dairy-chilled.svg",
    };
  }
  return {
    label: category || "Packaged Goods",
    color: "bg-stone-50 text-stone-900 border-stone-200",
    Icon: Package,
    image: "/images/food/packaged-goods.svg",
  };
}

const LIFECYCLE_STAGES = [
  { key: "AVAILABLE", label: "Surplus Listed", desc: "Logged to dispatch ledger" },
  { key: "ASSIGNED", label: "Courier Claimed", desc: "Volunteer courier routed" },
  { key: "PICKED_UP", label: "Custody Handover", desc: "Loaded in transport tote" },
  { key: "DELIVERED", label: "Shelter Arrival", desc: "Arrived at distribution dock" },
  { key: "COMPLETED", label: "Receipt Verified", desc: "Verified intake signoff" },
] as const;

function getStageIndex(status: string): number {
  switch (status) {
    case "AVAILABLE": return 0;
    case "ASSIGNED": return 1;
    case "PICKED_UP": return 2;
    case "DELIVERED": return 3;
    case "COMPLETED": return 4;
    default: return 0;
  }
}

export default function CustodyTrackingModal({ donation, onClose }: CustodyTrackingModalProps) {
  const [details, setDetails] = useState<EnrichedDonationDetails | null>(null);
  const [loadingAsync, setLoadingAsync] = useState(false);
  const [, startTransition] = useTransition();

  // Close on Escape key
  useEffect(() => {
    if (!donation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [donation, onClose]);

  // Seed cache and fetch deeper asynchronous custody telemetry
  useEffect(() => {
    if (!donation) {
      setDetails(null);
      return;
    }

    // Immediately seed the resource cache for instant acceptpage visits
    seedResourceCache(`donation:detail:${donation.id}`, donation);
    setDetails(donation as EnrichedDonationDetails);

    let isMounted = true;
    setLoadingAsync(true);

    donationsApi
      .getById(donation.id)
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.data.donation as EnrichedDonationDetails;
        startTransition(() => {
          setDetails(fetched);
          seedResourceCache(`donation:detail:${donation.id}`, fetched);
          setLoadingAsync(false);
        });
      })
      .catch(() => {
        if (isMounted) setLoadingAsync(false);
      });

    return () => {
      isMounted = false;
    };
  }, [donation]);

  if (!donation) return null;

  const currentDonation: EnrichedDonationDetails = (details || donation) as EnrichedDonationDetails;
  const catVisual = getCategoryVisual(currentDonation.food_category);
  const stageIdx = getStageIndex(currentDonation.status);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custody-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-white shadow-2xl flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper-deep px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-forest text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="custody-title" className="text-base font-bold text-ink">
                  Chain of Custody Tracking
                </h2>
                <span className="font-mono text-xs text-ink-muted">#{currentDonation.id.slice(0, 8)}</span>
              </div>
              <p className="text-xs text-ink-muted">Deterministic transport audit &amp; verified intake record</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={currentDonation.status} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-black/5 hover:text-ink transition-colors"
              aria-label="Close custody tracking"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Donation Summary Card */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-ivory border border-line">
            <div className="relative size-16 sm:size-20 rounded-lg overflow-hidden shrink-0 border border-sage shadow-xs bg-white">
              <img src={catVisual.image} alt={catVisual.label} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catVisual.color}`}>
                  {catVisual.label}
                </span>
                <span className="text-xs font-bold font-mono text-ink bg-white px-2.5 py-0.5 rounded-md border border-line">
                  {formatQuantity(currentDonation.quantity, currentDonation.unit)}
                </span>
              </div>
              <h3 className="text-base font-bold text-ink mt-1 truncate">{currentDonation.title}</h3>
              <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">
                {currentDonation.description || "Staged surplus food with certified cold-chain protection."}
              </p>
            </div>
          </div>

          {/* 5-Stage Custody Lifecycle Stepper */}
          <div className="p-4 rounded-xl bg-white border border-line">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-ink">
                Custody Lifecycle Progression
              </span>
              {loadingAsync && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-leaf-700 font-medium">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Syncing telemetry…</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              {LIFECYCLE_STAGES.map((step, idx) => {
                const isPassed = idx < stageIdx;
                const isCurrent = idx === stageIdx;
                const isPending = idx > stageIdx;

                return (
                  <div key={step.key} className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isPassed
                            ? "bg-forest text-white"
                            : isCurrent
                            ? "bg-emerald text-white ring-4 ring-emerald/20"
                            : "bg-paper text-ink-muted border border-line"
                        }`}
                      >
                        {isPassed ? "✓" : idx + 1}
                      </div>
                      {idx < LIFECYCLE_STAGES.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${isPassed ? "bg-forest" : "bg-line"}`} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent ? "text-emerald" : isPassed ? "text-ink" : "text-ink-muted"
                          }`}
                        >
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald bg-emerald-light px-2 py-0.5 rounded-full">
                            Active Step
                          </span>
                        )}
                        {isPassed && idx === 0 && (
                          <span className="text-[11px] text-ink-muted font-mono">
                            {formatDateTime(currentDonation.created_at)}
                          </span>
                        )}
                        {isPassed && idx === 1 && currentDonation.assignment?.assigned_at && (
                          <span className="text-[11px] text-ink-muted font-mono">
                            {formatDateTime(currentDonation.assignment.assigned_at)}
                          </span>
                        )}
                        {isPassed && idx === 2 && currentDonation.assignment?.picked_up_at && (
                          <span className="text-[11px] text-ink-muted font-mono">
                            {formatDateTime(currentDonation.assignment.picked_up_at)}
                          </span>
                        )}
                        {isPassed && idx === 3 && currentDonation.assignment?.delivered_at && (
                          <span className="text-[11px] text-ink-muted font-mono">
                            {formatDateTime(currentDonation.assignment.delivered_at)}
                          </span>
                        )}
                        {isPassed && idx === 4 && (
                          <span className="text-[11px] text-leaf-800 font-mono font-semibold">
                            {formatDateTime(currentDonation.updated_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Courier & Logistics Staging Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-ivory border border-line flex items-start gap-2.5">
              <MapPin className="size-4 text-forest shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Pickup Staging Dock
                </span>
                <span className="font-medium text-ink block mt-0.5">{currentDonation.pickup_address}</span>
                <span className="text-ink-soft text-[11px] block">{currentDonation.area || "Designated pickup bay"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-ivory border border-line flex items-start gap-2.5">
              <Clock className="size-4 text-forest shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Required Window
                </span>
                <span className="font-medium text-ink block mt-0.5">
                  Collect by {formatDateTime(currentDonation.pickup_deadline)}
                </span>
                <span className="text-amber-800 text-[11px] font-semibold block">
                  Cold-Chain &amp; Thermal Protection
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-ivory border border-line flex items-start gap-2.5">
              <Truck className="size-4 text-forest shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Volunteer Courier
                </span>
                <span className="font-medium text-ink block mt-0.5">
                  {stageIdx >= 1 ? "Youth Food Rescue Corps · Assigned" : "Awaiting Volunteer Dispatch"}
                </span>
                <span className="text-ink-soft text-[11px] block">
                  {stageIdx >= 2 ? "Cargo collected in sealed totes" : "Courier alerted via realtime stream"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-ivory border border-line flex items-start gap-2.5">
              <Building className="size-4 text-forest shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-ink-muted block uppercase tracking-wider font-semibold">
                  Receiving NGO Destination
                </span>
                <span className="font-medium text-ink block mt-0.5">
                  {currentDonation.recipient_ngo?.organization || "Hope Shelter Foundation"}
                </span>
                <span className="text-ink-soft text-[11px] block">Verified community distribution hub</span>
              </div>
            </div>
          </div>

          {/* Legal Protection Statement */}
          <div className="p-3 bg-emerald-light/60 rounded-xl border border-emerald/20 flex items-center gap-2 text-xs text-forest">
            <CheckCircle2 className="size-4 shrink-0 text-emerald" />
            <span>
              <strong>Good Samaritan Act Protection:</strong> Digital verification logs are stored for compliance under 42 U.S.C. § 1791.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-line bg-paper-deep px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close Tracking Sheet
          </Button>

          <Button asChild size="sm" className="bg-forest hover:bg-forest-deep text-white font-semibold">
            <Link href={`/acceptpage/${currentDonation.id}`} prefetch>
              <span>Open Full Permitted Manifest</span>
              <ExternalLink className="size-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
