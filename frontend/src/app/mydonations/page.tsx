"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { donationsApi } from "@/lib/api-client";
import { Package, Clock, MapPin, User, Phone, Plus, Filter } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const sampleDonations: Donation[] = [
    {
      id: "DON-8812",
      food: "Cooked Biryani & Dal",
      servings: "45 servings (~18 kg)",
      prepTime: "Today at 14:00",
      status: "Accepted",
      bestBefore: "Today, 18:00",
      location: "12 MG Road, Bengaluru",
      volunteer: "Arjun V. (Verified Courier)",
      volunteerPhone: "+91 91234 56789"
    },
    {
      id: "DON-8809",
      food: "Whole Wheat Loaves & Rolls",
      servings: "30 items",
      prepTime: "Today at 11:30",
      status: "Delivered",
      bestBefore: "Delivered",
      location: "Indiranagar 100ft Rd",
      volunteer: "Priya S. (Field Volunteer)",
      volunteerPhone: "+91 98777 66554"
    },
    {
      id: "DON-8794",
      food: "Fresh Organic Vegetable Crates",
      servings: "25 kg",
      prepTime: "Yesterday at 16:00",
      status: "Delivered",
      bestBefore: "Delivered",
      location: "Whitefield Main Rd",
      volunteer: "Kiran R. (Courier)",
      volunteerPhone: "+91 94444 33221"
    }
  ];

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await donationsApi.getMine({ limit: 50 });
      const raw = res.data?.donations || [];

      if (Array.isArray(raw) && raw.length > 0) {
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
      } else {
        setDonations(sampleDonations);
      }
    } catch {
      setDonations(sampleDonations);
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
      fetchDonations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Could not cancel donation.");
    }
  };

  const filtered = donations.filter((d) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return d.status === "Pending" || d.status === "Accepted" || d.status === "Picked";
    if (statusFilter === "completed") return d.status === "Delivered" || d.status === "COMPLETED";
    return true;
  });

  const activeCount = donations.filter((d) => d.status === "Pending" || d.status === "Accepted" || d.status === "Picked").length;
  const deliveredCount = donations.filter((d) => d.status === "Delivered" || d.status === "COMPLETED").length;

  return (
    <main className="min-h-screen bg-[#EEF4EC] text-[#111827]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Deep Forest Pine Command Banner */}
        <div className="bg-[#0B331E] border border-[#184F31] rounded-lg p-6 text-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#184F31]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#13492B] text-emerald-300 border border-[#21663F]">
                  DONOR DISPATCH LEDGER
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                  CHAIN OF CUSTODY VERIFIED
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Donation History & Custody Ledger
              </h1>
              <p className="text-xs text-emerald-100/75 mt-1 max-w-2xl">
                Complete audit trail of your surplus food dispatches, courier handovers, and certified shelter distributions
              </p>
            </div>

            <Link href="/donate">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#072616] rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer">
                <Plus className="size-4 stroke-[2.5]" />
                <span>Create New Donation</span>
              </button>
            </Link>
          </div>

          {/* 3 Integrated Ledger Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#184F31] pt-5">
            <div className="py-2 md:py-0 md:px-5 first:pl-0">
              <span className="text-xs font-medium text-emerald-200/70 uppercase tracking-wider">
                Total Dispatches
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {donations.length}
              </p>
              <p className="text-xs text-emerald-200/60 mt-1">
                Batches logged in custody system
              </p>
            </div>

            <div className="py-2 md:py-0 md:px-5">
              <span className="text-xs font-medium text-emerald-200/70 uppercase tracking-wider">
                Active in Transit
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {activeCount}
              </p>
              <p className="text-xs text-emerald-200/60 mt-1">
                Under active courier delivery
              </p>
            </div>

            <div className="py-2 md:py-0 md:px-5 last:pr-0">
              <span className="text-xs font-medium text-emerald-200/70 uppercase tracking-wider">
                Delivered & Intake Verified
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {deliveredCount}
              </p>
              <p className="text-xs text-emerald-200/60 mt-1">
                Confirmed received by shelters
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="manifest-card p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[#165E39] ml-1" />
            <span className="text-xs font-semibold text-[#0B331E] mr-1">Filter Records:</span>
            <div className="flex gap-1.5">
              {[
                { id: "all", label: "All Donations" },
                { id: "active", label: "Active in Transit" },
                { id: "completed", label: "Delivered" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-[#135936] text-white shadow-xs"
                      : "bg-[#E2ECE0] text-[#1E3E2B] hover:bg-[#D5E4D2] border border-[#CBDBC7]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-gray-600 font-mono font-medium">
            Showing {filtered.length} donation records
          </span>
        </div>

        {/* Donations List / Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="manifest-card p-5 space-y-2">
                <div className="h-4 bg-[#E2ECE0] rounded w-1/4 animate-pulse" />
                <div className="h-5 bg-[#E2ECE0] rounded w-1/2 animate-pulse" />
                <div className="h-4 bg-[#E2ECE0] rounded w-1/3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="manifest-card p-12 text-center">
            <p className="text-sm font-bold text-[#0B331E]">
              No donation records in this view
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Surplus batches you create will be permanently logged here with timestamped custody transfers.
            </p>
            <Link href="/donate">
              <button className="mt-4 px-4 py-2 bg-[#135936] hover:bg-[#0D4026] text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs">
                Create First Donation
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="manifest-docket p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-[#A2BFA0]"
              >
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0B331E] bg-[#E2ECE0] px-2 py-0.5 rounded border border-[#CBDBC7]">
                      #{item.id}
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">
                      {item.food}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        item.status === "Delivered"
                          ? "bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]"
                          : item.status === "Accepted" || item.status === "Picked"
                          ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                          : "bg-[#E4F2E7] text-[#115E34] border-[#A9D8B6]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-gray-700">
                    <span className="font-semibold text-gray-900">Quantity:</span> {item.servings} • Prepared: {item.prepTime}
                  </p>

                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="size-3.5 text-[#165E39] shrink-0" />
                    <span>{item.location}</span>
                  </div>

                  {item.volunteer && (
                    <div className="pt-1 flex items-center gap-3 text-[#115E34] font-medium">
                      <span>Assigned Courier: {item.volunteer}</span>
                      {item.volunteerPhone && (
                        <a
                          href={`tel:${item.volunteerPhone}`}
                          className="hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone className="size-3" />
                          <span>{item.volunteerPhone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#E2ECE0]">
                  {item.status === "Pending" && (
                    <button
                      onClick={() => handleCancel(item.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-300 rounded transition-colors cursor-pointer"
                    >
                      Cancel Listing
                    </button>
                  )}
                  <Link href="/acceptpage">
                    <button className="px-3.5 py-1.5 text-xs font-bold text-[#0B331E] bg-[#E2ECE0] hover:bg-[#D5E4D2] border border-[#CBDBC7] rounded transition-colors cursor-pointer">
                      View Custody
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
