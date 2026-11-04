"use client";

import { useState, useEffect } from "react";
import { volunteerApi } from "@/lib/api-client";
import { MapPin, Package, Clock, CheckCircle2, ArrowRight } from "lucide-react";

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
    text: isInitiallyClaimed ? "Assigned" : "Fresh",
    badge: isInitiallyClaimed ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200",
  });

  // Countdown timer calculation
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
        setStatus({ text: "Fresh", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" });
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
    <div className="bg-white border border-gray-200 hover:border-gray-300 transition-colors rounded-lg p-5 flex flex-col justify-between">
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-gray-500">
            #{donation.id ? String(donation.id).slice(-6).toUpperCase() : "TASK-01"}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            ~1.4 km away
          </span>
        </div>

        {/* Title & Category */}
        <h3 className="text-base font-semibold text-gray-900 tracking-tight">
          {foodTitle}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
          <MapPin className="size-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{area}</span>
          {state && <span>• {state}</span>}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-gray-100 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
            <Package className="size-3 text-gray-400" />
            <span className="tabular-nums">{quantity}</span>
          </span>
          {prepTime && (
            <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
              <Clock className="size-3 text-gray-400" />
              <span>Prepared {new Date(prepTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action / Countdown Area */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {!isAccepted ? (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer disabled:bg-gray-300 flex items-center justify-center gap-1.5"
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
          <div className="p-3 rounded-md border border-gray-200 bg-gray-50/70">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-gray-700">
                Shelf-Life Window
              </span>
              <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${status.badge}`}>
                {status.text}
              </span>
            </div>
            <div className="mt-1.5 text-lg font-mono font-bold text-gray-900 tabular-nums">
              {timeRemaining !== null ? formatTime(timeRemaining) : "Active in transit"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
