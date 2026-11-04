"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { donationsApi } from "@/lib/api-client";

interface Donation {
  id: string;
  food: string;
  servings: number | string;
  prepTime: string;
  status: string;
  volunteer?: string;
  volunteerPhone?: string;
  bestBefore: string;
  location: string;
}

export default function MyDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await donationsApi.getMine({ limit: 50 });
      const raw = res.data?.donations || [];

      if (Array.isArray(raw)) {
        const mapped: Donation[] = raw.map((d: any) => ({
          id: d.id,
          food: d.title || d.food_category || "Cooked Meals",
          servings: d.quantity ? `${d.quantity} ${d.unit || "servings"}` : "25 servings",
          prepTime: d.prepared_at ? new Date(d.prepared_at).toLocaleString() : "Recently prepared",
          status:
            d.status === "AVAILABLE"
              ? "Pending"
              : d.status === "ASSIGNED"
              ? "Accepted"
              : d.status === "PICKED_UP"
              ? "Picked"
              : d.status === "DELIVERED" || d.status === "COMPLETED"
              ? "Delivered"
              : d.status,
          bestBefore: d.expires_at ? new Date(d.expires_at).toLocaleTimeString() : "Within 6 hours",
          location: d.pickup_address || `${d.area || "Local Area"}, ${d.state || ""}`,
          volunteer: d.assignment?.volunteer?.name,
          volunteerPhone: d.assignment?.volunteer?.phonenumber,
        }));

        setDonations(mapped);
      }
    } catch (err: any) {
      console.error("Error fetching donations:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this donation?")) return;
    try {
      await donationsApi.cancel(id);
      alert("Donation cancelled successfully.");
      fetchDonations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Could not cancel donation.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAF8] text-[#1F2923]">
      <Navbar />

      <section className="relative overflow-hidden pt-12 pb-12 px-6 lg:px-12 border-b border-emerald-950/6 bg-gradient-to-b from-emerald-50/50 via-[#F9FAF8] to-[#F9FAF8]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 rounded-full text-xs font-semibold text-emerald-800 border border-emerald-200/60 mb-3 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Custody Chain Registry
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            My Food Rescue Ledger
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Monitor all your active listings, inspect courier handovers in real time, and verify community drop-off.
          </p>
        </div>
      </section>

      <section className="py-10 px-6 max-w-4xl mx-auto space-y-5">
        {loading && (
          <div className="space-y-4">
            <div className="h-44 rounded-2xl bg-white border border-emerald-950/8 shadow-premium-xs animate-shimmer" />
            <div className="h-44 rounded-2xl bg-white border border-emerald-950/8 shadow-premium-xs animate-shimmer" />
          </div>
        )}

        {!loading && donations.length === 0 && (
          <div className="text-center bg-white p-12 rounded-2xl border border-emerald-950/8 shadow-premium-xs max-w-md mx-auto">
            <span className="text-4xl">📦</span>
            <h3 className="text-lg font-bold text-gray-900 mt-3">No Active Donations Yet</h3>
            <p className="text-xs text-gray-500 mt-1 mb-6">
              When you post surplus meals, their real-time dispatch and delivery progress will appear here.
            </p>
            <Link href="/donate">
              <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer">
                Create First Donation
              </button>
            </Link>
          </div>
        )}

        {!loading &&
          donations.map((donation) => (
            <div
              key={donation.id}
              className="bg-white shadow-premium hover:shadow-premium-lg transition-all duration-300 rounded-2xl p-6 border border-emerald-950/8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      #{String(donation.id).slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{donation.location}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{donation.food}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                      donation.status === "Pending"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : donation.status === "Accepted"
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : donation.status === "Picked"
                        ? "bg-purple-50 text-purple-800 border border-purple-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        donation.status === "Pending"
                          ? "bg-amber-500 animate-pulse"
                          : donation.status === "Accepted"
                          ? "bg-blue-500 animate-pulse"
                          : donation.status === "Picked"
                          ? "bg-purple-500 animate-pulse"
                          : "bg-emerald-500"
                      }`}
                    />
                    {donation.status}
                  </span>

                  {donation.status === "Pending" && (
                    <button
                      onClick={() => handleCancel(donation.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Cancel Listing
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Volume</span>
                  <span className="font-semibold text-gray-900">{donation.servings}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Preparation</span>
                  <span className="font-semibold text-gray-900">{donation.prepTime || "Just now"}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Shelf Life</span>
                  <span className="font-semibold text-amber-700">{donation.bestBefore}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Custody Status</span>
                  <span className="font-semibold text-emerald-800">{donation.status}</span>
                </div>
              </div>

              {/* Courier Banner */}
              {donation.volunteer && (
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="size-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                      {donation.volunteer[0]}
                    </span>
                    <div>
                      <p className="font-bold text-emerald-950">
                        Courier: {donation.volunteer}
                        <span className="text-emerald-700 font-normal ml-2">✓ Verified Rescuer</span>
                      </p>
                      <p className="text-gray-500 text-[11px] mt-0.5">Assigned to transport cargo directly to shelter</p>
                    </div>
                  </div>
                  {donation.volunteerPhone && (
                    <a
                      href={`tel:${donation.volunteerPhone}`}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 font-semibold rounded-lg border border-emerald-300 transition"
                    >
                      📞 {donation.volunteerPhone}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
      </section>
    </main>
  );
}
