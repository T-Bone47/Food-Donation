"use client";

import { useState, useEffect } from "react";
import { volunteerApi } from "@/lib/api-client";
import { MapPin, Package, Clock, ArrowRight } from "lucide-react";

// Reference shelf life in hours
const shelfLifeHours: { [key: string]: number; _default: number } = {
  chapathi: 8,
  roti: 8,
  dal: 4,
  "vegetable curry": 3,
  rice: 4,
  biryani: 4,
  _default: 4,
};

const formatTime = (seconds: number) => {
  if (seconds <= 0) return "Expired";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
};

export default function DonationCard({
  donation,
  onClaimed,
}: {
  donation: any;
  onClaimed?: (id: string) => void;
}) {
  const isInitiallyClaimed =
    donation.status === "ASSIGNED" ||
    donation.status === "PICKED_UP" ||
    donation.status === "Volunteer Found";

  const [isAccepted, setIsAccepted] = useState(isInitiallyClaimed);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    text: isInitiallyClaimed ? "Assigned" : "Fresh Batch",
    badge: isInitiallyClaimed ? "bg-[#E5F0FA] text-[#0F4E80] border-[#B6D6F2]" : "bg-[#E1F2E7] text-[#0A5631] border-[#A7DFC0]",
  });

  useEffect(() => {
    if (!isAccepted || !expiryTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remainingSeconds = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
      setTimeRemaining(remainingSeconds);

      if (remainingSeconds <= 0) {
        setStatus({ text: "Expired", badge: "bg-red-50 text-red-800 border-red-200" });
      } else if (remainingSeconds < 3600) {
        setStatus({ text: "Expiring Soon", badge: "bg-amber-50 text-amber-800 border-amber-200" });
      } else {
        setStatus({ text: "Fresh Batch", badge: "bg-[#E1F2E7] text-[#0A5631] border-[#A7DFC0]" });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAccepted, expiryTime]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await volunteerApi.claimTask(donation.id);

      const prep = donation.prepared_at || donation.prepared_time || new Date().toISOString();
      const preparedAt = new Date(prep);
      const foodKey = (donation.food_type || donation.food_category || donation.title || "").toLowerCase();
      const lifeHours = shelfLifeHours[foodKey] || shelfLifeHours._default;
      const expiry = new Date(preparedAt.getTime() + lifeHours * 60 * 60 * 1000);

      setExpiryTime(expiry);
      setIsAccepted(true);
      if (onClaimed) onClaimed(donation.id);
    } catch (err: any) {
      console.error("Claim error:", err);
      setIsAccepted(true);
      if (onClaimed) onClaimed(donation.id);
    } finally {
      setLoading(false);
    }
  };

  const foodTitle = donation.food_type || donation.title || donation.food_category || "Surplus Food";
  const area = donation.area || donation.pickup_address || "Local Area";
  const state = donation.state || "";
  const prepTime = donation.prepared_at || donation.prepared_time;
  const quantity = donation.quantity ? `${donation.quantity} ${donation.unit || "servings"}` : "Standard batch";

  return (
    <div className="manifest-card hover:border-[#8EAF8B] transition-colors p-5 flex flex-col justify-between shadow-xs">
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#CBDBC7]/80">
          <span className="text-xs font-mono font-bold text-[#0E3824] bg-[#E2ECE0] px-2 py-0.5 rounded border border-[#CBDBC7]">
            #{donation.id ? String(donation.id).slice(-6).toUpperCase() : "TASK-01"}
          </span>
          <span className="text-xs text-[#166534] font-semibold bg-[#E2ECE0] px-2.5 py-0.5 rounded border border-[#CBDBC7]">
            ~1.4 km radius
          </span>
        </div>

        {/* Title & Category */}
        <h2 className="text-base font-bold text-[#0E3824] tracking-tight">
          {foodTitle}
        </h2>

        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
          <MapPin className="size-3.5 text-[#166534] shrink-0" />
          <span className="truncate">{area}</span>
          {state && <span>• {state}</span>}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-[#CBDBC7]/60 text-xs text-gray-700">
          <span className="inline-flex items-center gap-1 bg-[#E8F2E6] border border-[#CBDBC7] px-2 py-0.5 rounded font-medium">
            <Package className="size-3 text-[#166534]" />
            <span className="tabular-nums">{quantity}</span>
          </span>
          {prepTime && (
            <span className="inline-flex items-center gap-1 bg-[#E8F2E6] border border-[#CBDBC7] px-2 py-0.5 rounded font-medium">
              <Clock className="size-3 text-[#166534]" />
              <span>Prepared {new Date(prepTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action / Countdown Area */}
      <div className="mt-4 pt-3 border-t border-[#CBDBC7]/60">
        {!isAccepted ? (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-2 px-3 bg-[#135936] hover:bg-[#0E462A] text-white rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:bg-gray-300 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>Assigning Task...</span>
            ) : (
              <>
                <span>Accept Dispatch Task</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        ) : (
          <div className="p-3 rounded-md border border-[#CBDBC7] bg-[#E8F2E6]/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#0E3824]">
                Shelf-Life Window
              </span>
              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${status.badge}`}>
                {status.text}
              </span>
            </div>
            <div className="mt-1.5 text-lg font-mono font-bold text-[#0E3824] tabular-nums">
              {timeRemaining !== null ? formatTime(timeRemaining) : "Active in transit"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
