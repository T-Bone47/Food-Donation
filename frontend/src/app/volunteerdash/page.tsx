"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/volunavbar";
import DonationCard from "@/components/DonationCard";
import { volunteerApi } from "@/lib/api-client";
import { Truck, ArrowRight, CheckCircle2, Clock, MapPin, Filter, ShieldCheck } from "lucide-react";

export default function VolunteerDashboard() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const sampleTasks = [
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
  ];

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await volunteerApi.getTasks({ status: "AVAILABLE" });
      const raw = res.data?.tasks || [];

      if (Array.isArray(raw) && raw.length > 0) {
        setDonations(raw);
      } else {
        setDonations(sampleTasks);
      }
    } catch {
      setDonations(sampleTasks);
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
    <main className="min-h-screen text-[#143322]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Forest Green Command Banner */}
        <div className="bg-[#0B331E] text-white border border-[#174B2E] rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#184F31]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block size-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  Field Volunteer Logistics
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Rescue Task Pool
              </h1>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Surplus food pickups available for courier claiming and direct shelter delivery
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link href="/acceptpage">
                <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#072616] rounded-md text-xs font-semibold transition-colors cursor-pointer">
                  <span>Active Route Stepper</span>
                  <ArrowRight className="size-4" />
                </button>
              </Link>
            </div>
          </div>

          {/* 3 Metrics Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#184F31] pt-5">
            <div className="md:pr-5">
              <span className="text-xs font-medium text-emerald-300/80">
                Available In Zone
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {donations.length || 12}
              </p>
              <p className="text-xs text-emerald-300/70 mt-1">
                Surplus batches ready for pickup
              </p>
            </div>

            <div className="md:px-5 pt-4 md:pt-0">
              <span className="text-xs font-medium text-emerald-300/80">
                Completed Rescues
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                24
              </p>
              <p className="text-xs text-emerald-300/70 mt-1">
                Delivered safely to community shelters
              </p>
            </div>

            <div className="md:pl-5 pt-4 md:pt-0">
              <span className="text-xs font-medium text-emerald-300/80">
                Average Transit Time
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                32 min
              </p>
              <p className="text-xs text-emerald-300/70 mt-1">
                From facility claim to NGO drop-off
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar in Botanical Palette */}
        <div className="manifest-card p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[#166534] ml-1" />
            <span className="text-xs font-semibold text-[#0E3824] mr-2">Category:</span>
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
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    filterType === tab.id
                      ? "bg-[#135936] text-white"
                      : "bg-[#E6EFE4] text-[#143322] hover:bg-[#D5E3D2] border border-[#CBDBC7]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-gray-600 font-medium">
            Showing {filteredDonations.length} available tasks
          </span>
        </div>

        {/* Task Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="manifest-card p-5 space-y-3">
                <div className="h-4 bg-[#E2ECE0] rounded w-1/3" />
                <div className="h-6 bg-[#E2ECE0] rounded w-3/4" />
                <div className="h-4 bg-[#E2ECE0] rounded w-1/2" />
                <div className="h-8 bg-[#E2ECE0] rounded w-full mt-4" />
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
          <div className="manifest-card p-12 text-center">
            <p className="text-sm font-bold text-[#0E3824]">
              No available food rescue tasks in this category
            </p>
            <p className="text-xs text-gray-600 mt-1">
              New donation runs are dispatched continuously as partner facilities log surplus food.
            </p>
            <button
              onClick={() => setFilterType("all")}
              className="mt-4 px-3 py-1.5 bg-[#E6EFE4] hover:bg-[#D5E3D2] text-[#0E3824] text-xs font-semibold rounded border border-[#CBDBC7] cursor-pointer"
            >
              Reset Category Filter
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
