"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/volunavbar";
import DonationCard from "@/components/DonationCard";
import { volunteerApi, donationsApi } from "@/lib/api-client";

export default function VolunteerDashboard() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await volunteerApi.getTasks({ status: "AVAILABLE" });
      const raw = res.data?.tasks || [];

      if (Array.isArray(raw)) {
        setDonations(raw);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Error fetching nearby donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleClaimed = (id: string) => {
    setDonations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "ASSIGNED" } : d))
    );
  };

  const [filterType, setFilterType] = useState<string>("all");

  const filteredDonations = donations.filter((d) => {
    if (filterType === "all") return true;
    const cat = (d.food_type || d.food_category || d.title || "").toLowerCase();
    if (filterType === "cooked") return cat.includes("curry") || cat.includes("rice") || cat.includes("biryani") || cat.includes("meal") || cat.includes("chapathi");
    if (filterType === "bakery") return cat.includes("bread") || cat.includes("cake") || cat.includes("bake") || cat.includes("roti");
    if (filterType === "produce") return cat.includes("veg") || cat.includes("fruit") || cat.includes("produce");
    return true;
  });

  return (
    <main className="min-h-screen bg-[#F9FAF8] text-[#1F2923]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-12 px-6 lg:px-12 border-b border-emerald-950/6 bg-gradient-to-b from-emerald-50/50 via-[#F9FAF8] to-[#F9FAF8]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 rounded-full text-xs font-semibold text-emerald-800 border border-emerald-200/60 mb-4 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Courier Fleet • 12 Live Pickup Demands
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            Volunteer Rescue Operations
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Claim live surplus food batches from nearby restaurants and safely transport nutrition to verified community shelters.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-950/8 shadow-premium-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">My Pickups</span>
              <p className="text-xl font-bold font-mono text-emerald-800 mt-0.5">245</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-950/8 shadow-premium-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Distance Covered</span>
              <p className="text-xl font-bold font-mono text-emerald-800 mt-0.5">58 km</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-950/8 shadow-premium-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Karma Points</span>
              <p className="text-xl font-bold font-mono text-emerald-800 mt-0.5">1,240</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-950/8 shadow-premium-xs">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Courier Rank</span>
              <p className="text-xl font-bold text-amber-600 mt-0.5 flex items-center justify-center gap-1">
                <span>🥇 Gold</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Donations Feed Section */}
      <section className="py-10 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Available Rescues Near You</h2>
            <p className="text-xs text-gray-500">Live task pool within 5.0 km radius</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Batches" },
              { id: "cooked", label: "🍲 Cooked Meals" },
              { id: "bakery", label: "🥖 Bakery" },
              { id: "produce", label: "🥦 Produce" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs ${
                  filterType === tab.id
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-gray-700 hover:bg-emerald-50/60 border border-emerald-950/8"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-emerald-950/8 shadow-premium-xs space-y-4">
                <div className="flex justify-between">
                  <div className="h-5 w-20 rounded-md animate-shimmer" />
                  <div className="h-5 w-16 rounded-md animate-shimmer" />
                </div>
                <div className="h-6 w-3/4 rounded-md animate-shimmer" />
                <div className="h-4 w-1/2 rounded-md animate-shimmer" />
                <div className="h-10 w-full rounded-xl animate-shimmer mt-4" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 text-center">
            {error}
          </div>
        )}

        {!loading && filteredDonations.length === 0 && (
          <div className="text-center bg-white p-12 rounded-2xl border border-emerald-950/8 shadow-premium-xs max-w-md mx-auto">
            <span className="text-4xl">🌟</span>
            <h3 className="text-lg font-bold text-gray-900 mt-3">All Clear in Your Vicinity!</h3>
            <p className="text-xs text-gray-500 mt-1">
              No pending donations requiring courier pickup right now. You will receive an instant push alert when new food surplus is reported.
            </p>
          </div>
        )}

        {!loading && filteredDonations.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonations.map((item) => (
              <DonationCard key={item.id} donation={item} onClaimed={handleClaimed} />
            ))}
          </div>
        )}
      </section>

      {/* Volunteer Badges & Guild Section */}
      <section className="py-12 px-6 lg:px-12 bg-white border-t border-emerald-950/6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Courier Recognition Guild
          </span>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-3">Volunteer Honors & Badges</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-8">
            Every rescue milestone awards verified blockchain badges and sustainability dividends.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-premium-xs text-center">
              <span className="text-3xl">🥇</span>
              <h4 className="font-bold text-amber-950 text-sm mt-2">Gold Rescuer</h4>
              <p className="text-xs text-amber-800/80 mt-1">100+ Rescues Completed</p>
              <div className="mt-3 inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                ✓ Unlocked (Tier 3)
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-premium-xs text-center">
              <span className="text-3xl">🥈</span>
              <h4 className="font-bold text-slate-900 text-sm mt-2">Silver Rescuer</h4>
              <p className="text-xs text-slate-600 mt-1">50+ Rescues Completed</p>
              <div className="mt-3 inline-flex items-center text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                ✓ Unlocked
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50/40 border border-orange-200/60 shadow-premium-xs text-center">
              <span className="text-3xl">🥉</span>
              <h4 className="font-bold text-orange-950 text-sm mt-2">Bronze Rescuer</h4>
              <p className="text-xs text-orange-800/80 mt-1">First 10 Rescues Completed</p>
              <div className="mt-3 inline-flex items-center text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                ✓ Unlocked
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
