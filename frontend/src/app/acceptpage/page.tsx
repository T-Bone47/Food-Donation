"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/volunavbar";
import { volunteerApi } from "@/lib/api-client";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Building2
} from "lucide-react";

export default function ServicePage() {
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchActiveTask = async () => {
    try {
      const res = await volunteerApi.getTasks({ status: "ASSIGNED" });
      const tasks = res.data?.tasks || [];
      if (tasks.length > 0) {
        setActiveTask(tasks[0]);
      } else {
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
        id: "REC-4091",
        food: "Vegetable Biryani & Dal",
        location: "12 MG Road, Bengaluru, Karnataka (560001)",
        donor: "Green Cafe Caterers",
        donorPhone: "+91 98765 43210",
        donorEmail: "dispatch@greencafe.com",
        bestBefore: "Today, 19:30",
        type: "Prepared Catering",
        servings: "45 servings (~18 kg)",
      };

  return (
    <main className="min-h-screen text-[#143322]">
      <Navbar />

      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
        {/* Forest Green Command Banner */}
        <div className="bg-[#0B331E] text-white border border-[#174B2E] rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block size-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  Live Chain of Custody
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Active Delivery Manifest
              </h1>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Custody transfer tracking from donor facility to community recipient hub
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-300/80 font-mono">MANIFEST:</span>
              <span className="text-xs font-bold font-mono text-emerald-100 bg-[#133F27] border border-[#1E5A38] px-3 py-1 rounded">
                #{donation.id}
              </span>
            </div>
          </div>
        </div>

        {/* Linear Stepper in Tactical Manifest Docket */}
        <div className="manifest-docket p-6">
          <div className="flex items-center justify-between relative mb-6">
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-[#CBDBC7] -z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  status === "Accepted" || status === "Picked" || status === "Delivered"
                    ? "bg-[#135936] text-white"
                    : "bg-[#E6EFE4] text-gray-500 border border-[#BACDB6]"
                }`}
              >
                1
              </div>
              <span className="text-xs font-bold text-[#0E3824] mt-2">Claimed</span>
              <span className="text-[11px] text-gray-600">Pickup dispatched</span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  status === "Picked" || status === "Delivered"
                    ? "bg-[#135936] text-white"
                    : status === "Accepted"
                    ? "bg-amber-600 text-white ring-2 ring-amber-100"
                    : "bg-[#E6EFE4] text-gray-500 border border-[#BACDB6]"
                }`}
              >
                2
              </div>
              <span className="text-xs font-bold text-[#0E3824] mt-2">In Transit</span>
              <span className="text-[11px] text-gray-600">Cargo on route</span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  status === "Delivered"
                    ? "bg-[#135936] text-white"
                    : "bg-[#E6EFE4] text-gray-500 border border-[#BACDB6]"
                }`}
              >
                3
              </div>
              <span className="text-xs font-bold text-[#0E3824] mt-2">Delivered</span>
              <span className="text-[11px] text-gray-600">Shelter confirmed</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-[#CBDBC7]/60">
            {status === "Accepted" && (
              <button
                onClick={handlePicked}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 bg-[#135936] hover:bg-[#0E462A] text-white rounded-md text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? "Confirming..." : "Confirm Pickup & Begin Transit"}
              </button>
            )}
            {status === "Picked" && (
              <button
                onClick={handleDelivered}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 bg-[#135936] hover:bg-[#0E462A] text-white rounded-md text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? "Confirming..." : "Confirm Handover & Delivery to Shelter"}
              </button>
            )}
            {status === "Delivered" && (
              <div className="p-3 bg-[#E1F2E7] text-[#0A5631] rounded-md text-center text-xs font-semibold border border-[#A7DFC0] flex items-center justify-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#0A5631]" />
                <span>Delivery confirmed. Food transferred safely into verified recipient custody.</span>
              </div>
            )}
          </div>
        </div>

        {/* Cargo & Contact Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Cargo Manifest */}
          <div className="manifest-card p-5 space-y-3">
            <span className="text-xs font-semibold text-[#166534] uppercase tracking-wider">
              Food Rescue Cargo Manifest
            </span>
            <h3 className="text-base font-bold text-[#0E3824]">
              {donation.food}
            </h3>

            <div className="space-y-2 text-xs pt-2">
              <div className="flex justify-between py-1.5 border-b border-[#CBDBC7]/50">
                <span className="text-gray-600">Quantity / Volume:</span>
                <span className="font-semibold text-[#0E3824] tabular-nums">{donation.servings}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#CBDBC7]/50">
                <span className="text-gray-600">Food Classification:</span>
                <span className="font-semibold text-[#0E3824]">{donation.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#CBDBC7]/50">
                <span className="text-gray-600">Expiry Window:</span>
                <span className="font-semibold text-amber-700">{donation.bestBefore}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-600">Handling Requirement:</span>
                <span className="font-medium text-[#0E3824]">Keep warm / insulated container</span>
              </div>
            </div>
          </div>

          {/* Facility & Contact Details */}
          <div className="manifest-card p-5 space-y-3">
            <span className="text-xs font-semibold text-[#166534] uppercase tracking-wider">
              Facility Pickup & Contact
            </span>
            <h3 className="text-base font-bold text-[#0E3824]">
              {donation.donor}
            </h3>

            <div className="flex items-start gap-2 text-xs text-gray-700">
              <MapPin className="size-4 text-[#166534] shrink-0 mt-0.5" />
              <span>{donation.location}</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`tel:${donation.donorPhone}`}
                className="w-full py-2 bg-[#E6EFE4] hover:bg-[#D5E3D2] text-[#0E3824] rounded-md text-xs font-semibold text-center border border-[#BACDB6] transition-colors flex items-center justify-center gap-1.5"
              >
                <Phone className="size-3.5 text-[#166534]" />
                <span>Call Dispatch ({donation.donorPhone})</span>
              </a>
              <p className="text-[11px] text-gray-500 text-center">
                Contact facility manager if dock entrance is unattended
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
