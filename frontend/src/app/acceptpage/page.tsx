"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/volunavbar";
import { volunteerApi, donationsApi } from "@/lib/api-client";

export default function ServicePage() {
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchActiveTask = async () => {
    try {
      setLoading(true);
      const res = await volunteerApi.getTasks({ status: "ASSIGNED" });
      const tasks = res.data?.tasks || [];
      if (tasks.length > 0) {
        setActiveTask(tasks[0]);
      } else {
        // Try picked up tasks
        const pickedRes = await volunteerApi.getTasks({ status: "PICKED_UP" });
        const picked = pickedRes.data?.tasks || [];
        if (picked.length > 0) {
          setActiveTask(picked[0]);
        } else {
          setActiveTask(null);
        }
      }
    } catch (err) {
      console.error("Error fetching active volunteer task:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTask();
  }, []);

  const handlePicked = async () => {
    if (!activeTask) return;
    setActionLoading(true);
    try {
      await volunteerApi.confirmPickup(activeTask.id);
      alert("Pickup confirmed! Cargo is now in transit.");
      fetchActiveTask();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Error confirming pickup");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelivered = async () => {
    if (!activeTask) return;
    setActionLoading(true);
    try {
      await volunteerApi.confirmDelivery(activeTask.id);
      alert("Delivery confirmed! Notified receiving NGO for quality inspection.");
      fetchActiveTask();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Error confirming delivery");
    } finally {
      setActionLoading(false);
    }
  };

  const status =
    activeTask?.status === "PICKED_UP"
      ? "Picked"
      : activeTask?.status === "DELIVERED" || activeTask?.status === "COMPLETED"
      ? "Delivered"
      : "Accepted";

  const donation = activeTask
    ? {
        id: activeTask.id,
        food: activeTask.title || activeTask.food_category || "Fresh Cooked Meals",
        location: activeTask.pickup_address || `${activeTask.area || "Bengaluru"}, ${activeTask.state || "Karnataka"}`,
        donor: activeTask.donor?.name || "Green Cafe Caterers",
        donorPhone: activeTask.donor?.phonenumber || "+91 98765 43210",
        donorEmail: activeTask.donor?.email || "contact@greencafe.com",
        bestBefore: activeTask.expires_at ? new Date(activeTask.expires_at).toLocaleTimeString() : "Within 2 hours",
        type: activeTask.food_category || "Cooked Meals",
        servings: activeTask.quantity ? `${activeTask.quantity} ${activeTask.unit || "servings"}` : "25 servings",
      }
    : {
        id: "D-DEMO-101",
        food: "Vegetable Biryani",
        location: "MG Road, Bengaluru",
        donor: "Green Cafe Caterers",
        donorPhone: "+91 98765 43210",
        donorEmail: "contact@greencafe.com",
        bestBefore: "2 hours",
        type: "Main Course",
        servings: "25 servings",
      };

  return (
    <main className="min-h-screen bg-[#F9FAF8] text-[#1F2923]">
      <Navbar />

      <div className="max-w-4xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 mb-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Custody Chain Transfer
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Mission Dispatch & Handover
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Tracking custody transfer from donor to verified community hub</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">MISSION ID:</span>
            <span className="text-xs font-bold font-mono text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-md">
              {donation.id}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-emerald-950/8 shadow-premium-xs space-y-4">
            <div className="h-6 w-1/3 rounded-md animate-shimmer" />
            <div className="h-4 w-1/2 rounded-md animate-shimmer" />
            <div className="h-32 w-full rounded-xl animate-shimmer" />
          </div>
        ) : (
          <>
            {/* Interactive Progress Stepper */}
            <div className="bg-white p-6 rounded-2xl mb-6 border border-emerald-950/8 shadow-premium-xs">
              <div className="flex items-center justify-between relative mb-6">
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 -z-0" />
                
                {/* Step 1 */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      status === "Accepted" || status === "Picked" || status === "Delivered"
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    ✓
                  </div>
                  <span className="text-xs font-bold text-gray-900 mt-2">Claimed</span>
                  <span className="text-[10px] text-gray-400">Step 1</span>
                </div>

                {/* Step 2 */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      status === "Picked" || status === "Delivered"
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                        : status === "Accepted"
                        ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-xs font-bold text-gray-900 mt-2">Picked Up</span>
                  <span className="text-[10px] text-gray-400">In Cargo Transit</span>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      status === "Delivered"
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-xs font-bold text-gray-900 mt-2">Delivered</span>
                  <span className="text-[10px] text-gray-400">Shelter Verified</span>
                </div>
              </div>

              {/* Action Buttons with High-Tactile States */}
              <div className="pt-4 border-t border-gray-100">
                {status === "Accepted" && (
                  <button
                    onClick={handlePicked}
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-premium transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {actionLoading ? "Signing Cryptographic Handover..." : "Confirm Physical Pickup From Donor ✅"}
                  </button>
                )}
                {status === "Picked" && (
                  <button
                    onClick={handleDelivered}
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-premium transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {actionLoading ? "Verifying Intake Bay..." : "Confirm Intake Delivery to Shelter 🏁"}
                  </button>
                )}
                {status === "Delivered" && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs font-semibold border border-emerald-200">
                    🎉 Delivery Complete! Food safely transferred into community custody.
                  </div>
                )}
              </div>
            </div>

            {/* Donation Details & Contact Card Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Batch Manifest */}
              <div className="bg-white p-6 rounded-2xl border border-emerald-950/8 shadow-premium-xs space-y-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Rescue Cargo Manifest
                </span>
                <h3 className="text-xl font-bold text-gray-900">{donation.food}</h3>

                <div className="space-y-2 text-xs pt-2">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Servings Volume:</span>
                    <span className="font-semibold text-gray-900">{donation.servings}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Food Category:</span>
                    <span className="font-semibold text-gray-900">{donation.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Best Consumed:</span>
                    <span className="font-semibold text-amber-700">{donation.bestBefore}</span>
                  </div>
                </div>
              </div>

              {/* Donor Contact & Coordinates */}
              <div className="bg-white p-6 rounded-2xl border border-emerald-950/8 shadow-premium-xs space-y-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Pickup Location & Contact
                </span>
                <h3 className="text-lg font-bold text-gray-900">{donation.donor}</h3>
                <p className="text-xs text-gray-600">📍 {donation.location}</p>

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`tel:${donation.donorPhone}`}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 rounded-lg text-xs font-semibold text-center border border-emerald-200/80 transition"
                  >
                    📞 Call Donor: {donation.donorPhone}
                  </a>
                  <a
                    href={`mailto:${donation.donorEmail}`}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold text-center border border-gray-200 transition"
                  >
                    📧 {donation.donorEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-white p-6 rounded-2xl shadow-premium-xs border border-emerald-950/8 text-center">
              <div className="flex items-center justify-between mb-3 text-left">
                <h3 className="text-sm font-bold text-gray-900">
                  Live Dispatch Route & Navigation 🗺️
                </h3>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  Open in Google Maps ↗
                </span>
              </div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9856515405814!2d77.5945627!3d12.9715987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru!5e0!3m2!1sen!2sin!4v1694800000000!5m2!1sen!2sin"
                width="100%"
                height="280"
                allowFullScreen
                loading="lazy"
                className="w-full rounded-xl shadow-xs border border-gray-200"
              ></iframe>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

