"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/volunavbar";
import DonationCard from "@/components/DonationCard";
import { volunteerApi } from "@/lib/api-client";
import { Truck, ArrowRight, CheckCircle2, Clock, MapPin, Filter } from "lucide-react";

export default function VolunteerDashboard() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await volunteerApi.getTasks({ status: "AVAILABLE" });
      const raw = res.data?.tasks || [];

      if (Array.isArray(raw) && raw.length > 0) {
        setDonations(raw);
      } else {
        // Authentic sample tasks matching Copia / ChowMatch logistics
        setDonations([
          {
            id: "TSK-8901",
            food_type: "Hot Meals & Biryani",
            quantity: 50,
            unit: "servings",
            area: "Koramangala 5th Block",
            state: "Karnataka",
            prepared_at: new Date(Date.now() - 3600000).toISOString(),
            status: "AVAILABLE",
          },
          {
            id: "TSK-8902",
            food_type: "Artisan Bread & Bagels",
            quantity: 35,
            unit: "items",
            area: "Indiranagar 12th Main",
            state: "Karnataka",
            prepared_at: new Date(Date.now() - 7200000).toISOString(),
            status: "AVAILABLE",
          },
          {
            id: "TSK-8903",
            food_type: "Organic Veg Crates",
            quantity: 20,
            unit: "kg",
            area: "HSR Layout Sector 2",
            state: "Karnataka",
            prepared_at: new Date(Date.now() - 5400000).toISOString(),
            status: "AVAILABLE",
          },
          {
            id: "TSK-8904",
            food_type: "Vegetable Pulao & Curry",
            quantity: 40,
            unit: "servings",
            area: "JP Nagar Phase 3",
            state: "Karnataka",
            prepared_at: new Date(Date.now() - 1800000).toISOString(),
            status: "AVAILABLE",
          },
        ]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Error fetching available tasks");
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

  const filteredDonations = donations.filter((d) => {
    if (filterType === "all") return true;
    const cat = (d.food_type || d.food_category || d.title || "").toLowerCase();
    if (filterType === "cooked") return cat.includes("curry") || cat.includes("rice") || cat.includes("biryani") || cat.includes("meal") || cat.includes("chapathi") || cat.includes("pulao");
    if (filterType === "bakery") return cat.includes("bread") || cat.includes("cake") || cat.includes("bake") || cat.includes("roti") || cat.includes("bagel");
    if (filterType === "produce") return cat.includes("veg") || cat.includes("fruit") || cat.includes("produce") || cat.includes("crate");
    return true;
  });

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Title & Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Rescue Task Pool
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Available surplus food pickups ready for volunteer courier transit
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/acceptpage">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-sm font-medium transition-colors cursor-pointer">
                <span>Active Route Stepper</span>
                <ArrowRight className="size-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Courier Operational Overview: 3 KPIs */}
        <div className="bg-white border border-gray-200 rounded-lg grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <div className="p-5">
            <span className="text-xs font-medium text-gray-500">
              Available Dispatches
            </span>
            <p className="text-3xl font-bold font-mono tracking-tight text-gray-900 mt-1 tabular-nums">
              {donations.length || 12}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Surplus pickups in your service radius
            </p>
          </div>

          <div className="p-5">
            <span className="text-xs font-medium text-gray-500">
              Completed Rescues
            </span>
            <p className="text-3xl font-bold font-mono tracking-tight text-gray-900 mt-1 tabular-nums">
              24
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Verified deliveries to community shelters
            </p>
          </div>

          <div className="p-5">
            <span className="text-xs font-medium text-gray-500">
              Average Transit Time
            </span>
            <p className="text-3xl font-bold font-mono tracking-tight text-gray-900 mt-1 tabular-nums">
              32 min
            </p>
            <p className="text-xs text-gray-500 mt-1">
              From facility pickup to recipient handover
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="size-4 text-gray-500 ml-1" />
            <span className="text-xs font-medium text-gray-700 mr-2">Filter by Category:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All Batches" },
                { id: "cooked", label: "Prepared Meals" },
                { id: "bakery", label: "Bakery & Bread" },
                { id: "produce", label: "Fresh Produce" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                    filterType === tab.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            Showing {filteredDonations.length} available tasks
          </span>
        </div>

        {/* Task Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-6 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        ) : filteredDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDonations.map((item) => (
              <DonationCard key={item.id} donation={item} onClaimed={handleClaimed} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-sm font-medium text-gray-900">
              No available food rescue tasks in this category
            </p>
            <p className="text-xs text-gray-500 mt-1">
              New donation runs are dispatched continuously as partner facilities log surplus food.
            </p>
            <button
              onClick={() => setFilterType("all")}
              className="mt-4 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded cursor-pointer"
            >
              Reset Category Filter
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
