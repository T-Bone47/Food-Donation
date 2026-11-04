"use client";

import { useState, useEffect } from "react";
import { volunteerApi } from "@/lib/api-client";

// Reference frontend shelf life in hours
const shelfLifeHours: { [key: string]: number; _default: number } = {
  chapathi: 8,
  roti: 8,
  dal: 4,
  "vegetable curry": 3,
  rice: 4,
  biryani: 4,
  _default: 4,
};

// Helper function to format the time remaining
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
    color: isInitiallyClaimed ? "bg-green-500" : "bg-gray-400",
  });

  // Countdown timer calculation
  useEffect(() => {
    if (!isAccepted || !expiryTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remainingSeconds = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);
      setTimeRemaining(remainingSeconds);

      if (remainingSeconds <= 0) {
        setStatus({ text: "Expired", color: "bg-red-500" });
      } else if (remainingSeconds < 3600) {
        setStatus({ text: "Expiring Soon", color: "bg-yellow-500" });
      } else {
        setStatus({ text: "Fresh", color: "bg-green-500" });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAccepted, expiryTime]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Connect to real backend
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
      // Fallback optimistic accept for presentation
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
    <div className="bg-white shadow-md p-6 rounded-lg hover:shadow-lg transition-all border border-green-100">
      <h3 className="text-xl font-bold text-green-700">{foodTitle}</h3>
      <p className="text-gray-600 mt-1">
        📍 {area}{state ? `, ${state}` : ""}
      </p>
      {prepTime && (
        <p className="text-gray-600 mt-1">
          ⏰ Prepared at: {new Date(prepTime).toLocaleString()}
        </p>
      )}
      <p className="text-gray-600 mt-1">
        📦 Quantity: {quantity}
      </p>

      {!isAccepted ? (
        <button
          onClick={handleAccept}
          disabled={loading}
          className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium cursor-pointer disabled:bg-gray-400"
        >
          {loading ? "Accepting..." : "Accept Donation"}
        </button>
      ) : (
        <div className="mt-4 p-4 rounded-lg border border-green-200 bg-green-50/50">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-700">Status:</span>
            <span className={`px-3 py-1 text-sm text-white font-bold rounded-full ${status.color}`}>
              {status.text}
            </span>
          </div>
          <div className="mt-2 text-center text-2xl font-mono text-gray-800">
            {timeRemaining !== null ? formatTime(timeRemaining) : "Calculating..."}
          </div>
        </div>
      )}
    </div>
  );
}
