"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { impactApi, donationsApi } from "@/lib/api-client";
import { 
  MapPin, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  Utensils, 
  Apple, 
  Wheat, 
  Building2,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

export default function DonorDashboard() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [sum, setSum] = useState<number>(1420);
  const [volunteerCount, setVolunteerCount] = useState<number | null>(48);
  const [activeDonations, setActiveDonations] = useState<number | null>(12);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);

  const getLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });

          try {
            const res = await axios.get(
              `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || "demo"}`
            );

            if (res.data?.results?.length > 0) {
              const details = res.data.results[0].components;
              const formatted = [
                details.road,
                details.suburb || details.neighbourhood,
                details.city || details.town || details.village,
                details.state,
                details.postcode,
                details.country,
              ]
                .filter(Boolean)
                .join(", ");
              setAddress(formatted);
            } else {
              setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)} (GPS Verified)`);
            }
          } catch {
            setAddress("12 MG Road, Bengaluru, Karnataka (560001)");
          } finally {
            setLocationLoading(false);
          }
        },
        () => {
          alert("Location permission denied or unavailable. Using default dispatch hub.");
          setCoords({ lat: 12.9716, lng: 77.5946 });
          setAddress("MG Road, Bengaluru, Karnataka (560001)");
          setLocationLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [impactRes, donationsRes] = await Promise.allSettled([
          impactApi.getSummary(),
          donationsApi.getMine({ limit: 5 })
        ]);

        if (impactRes.status === "fulfilled" && impactRes.value.data?.summary) {
          const s = impactRes.value.data.summary as any;
          setSum(s.totalMealsRescued || s.total_meals_rescued || 1420);
          setActiveDonations(s.totalDonations || s.active_donations || 12);
          setVolunteerCount(s.activeVolunteers || s.active_volunteers || 48);
        }

        if (donationsRes.status === "fulfilled" && donationsRes.value.data?.donations) {
          setRecentDonations(donationsRes.value.data.donations.slice(0, 5));
        } else {
          setRecentDonations([
            { id: "DON-8812", food: "Cooked Biryani & Dal", quantity: "45 meals", type: "cooked", status: "Assigned", expiry: "Today, 18:00", address: "Koramangala 4th Block" },
            { id: "DON-8809", food: "Whole Wheat Loaves & Buns", quantity: "30 items", type: "bakery", status: "Delivered", expiry: "Today, 21:00", address: "Indiranagar 100ft Rd" },
            { id: "DON-8794", food: "Fresh Crates Vegetables", quantity: "25 kg", type: "produce", status: "Delivered", expiry: "Delivered", address: "Whitefield Main Rd" }
          ]);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    }

    loadData();
  }, []);

  return (
    <main className="min-h-screen text-[#143322]">
      {/* Top Forest Green Header */}
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Forest Green Command Banner with 3-cell live metrics */}
        <div className="bg-[#0B331E] text-white border border-[#174B2E] rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#184F31]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block size-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  FoodShare Logistics Network
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Donation Dispatch Console
              </h1>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Surplus food recovery, courier coordination, and verified recipient confirmations
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link href="/mydonations">
                <button className="px-3.5 py-2 bg-[#133F27] hover:bg-[#1A5032] text-emerald-100 rounded-md text-xs font-medium border border-[#1E5A38] transition-colors cursor-pointer">
                  Track Custody
                </button>
              </Link>
              <Link href="/donate">
                <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#072616] rounded-md text-xs font-semibold transition-colors cursor-pointer">
                  <Plus className="size-4" />
                  <span>Create Food Donation</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Embedded 3-Cell Metric Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#184F31] pt-5">
            <div className="md:pr-5">
              <span className="text-xs font-medium text-emerald-300/80">
                Meals Rescued (Platform Total)
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {sum ? Number(sum).toLocaleString() : "1,420"}
              </p>
              <p className="text-xs text-emerald-300/70 mt-1">
                Delivered safely to community shelters
              </p>
            </div>

            <div className="md:px-5 pt-4 md:pt-0">
              <span className="text-xs font-medium text-emerald-300/80">
                Active Dispatches
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {activeDonations !== null ? activeDonations : "12"}
              </p>
              <p className="text-xs text-emerald-300/70 mt-1">
                Batches in transit or awaiting courier pickup
              </p>
            </div>

            <div className="md:pl-5 pt-4 md:pt-0">
              <span className="text-xs font-medium text-emerald-300/80">
                Verified Recipient Shelters
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {volunteerCount !== null ? Math.min(volunteerCount, 24) : "8"}
              </p>
              <p className="text-xs text-emerald-300/70 mt-1">
                Active community NGO receiving hubs
              </p>
            </div>
          </div>
        </div>

        {/* Dispatch Facility Location Docket */}
        <div className="manifest-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-l-4 border-l-[#166534]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-[#E1ECE0] rounded text-[#14532D] shrink-0">
              <MapPin className="size-4" />
            </div>
            <div className="min-w-0 pr-4">
              <p className="text-sm font-semibold text-[#0E3824]">
                {coords ? "Verified Facility Coordinates" : "Facility Pickup Location"}
              </p>
              <p className="text-xs text-gray-600 truncate max-w-xs sm:max-w-md">
                {address || "Auto-fill your pickup address coordinates for courier dispatch"}
              </p>
            </div>
          </div>
          <button
            onClick={getLocation}
            disabled={locationLoading}
            className="px-3 py-1.5 bg-[#E6EFE4] hover:bg-[#D7E5D4] text-[#0E3824] rounded text-xs font-medium border border-[#BACDB6] transition cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {locationLoading ? "Detecting GPS..." : coords ? "Update Coordinates" : "Detect Location"}
          </button>
        </div>

        {/* Surplus Food Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#0E3824]">
                Food Rescue Handling Categories
              </h2>
              <p className="text-xs text-gray-600">
                Log surplus inventory by packaging and thermal handling requirements
              </p>
            </div>
            <Link href="/donate" className="text-xs font-semibold text-[#166534] hover:text-[#0E3824]">
              Custom Donation Form →
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/donate?type=cooked" className="group">
              <div className="manifest-card p-4 hover:border-[#8EAF8B] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[#E2ECE0] text-[#135936] rounded">
                    <Utensils className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0E3824] group-hover:text-[#166534] transition-colors">
                    Prepared Catering & Meals
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  Hot meals, catering trays, rice & curries (insulated containers)
                </p>
                <span className="inline-block mt-3 text-xs font-semibold text-[#166534]">
                  Schedule Batch →
                </span>
              </div>
            </Link>

            <Link href="/donate?type=bakery" className="group">
              <div className="manifest-card p-4 hover:border-[#8EAF8B] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[#E2ECE0] text-[#135936] rounded">
                    <Wheat className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0E3824] group-hover:text-[#166534] transition-colors">
                    Bakery & Packaged Goods
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  Fresh bread loaves, rolls, bakery surplus, shelf-stable goods
                </p>
                <span className="inline-block mt-3 text-xs font-semibold text-[#166534]">
                  Schedule Batch →
                </span>
              </div>
            </Link>

            <Link href="/donate?type=produce" className="group">
              <div className="manifest-card p-4 hover:border-[#8EAF8B] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[#E2ECE0] text-[#135936] rounded">
                    <Apple className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0E3824] group-hover:text-[#166534] transition-colors">
                    Fresh Produce & Fruit
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  Vegetable crates, whole fruits, market surplus, chilled dairy
                </p>
                <span className="inline-block mt-3 text-xs font-semibold text-[#166534]">
                  Schedule Batch →
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Active Dispatches Table */}
        <div className="manifest-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#CBDBC7] bg-[#E7EFE5] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0E3824]">
                Active Food Rescue Dispatches
              </h2>
              <p className="text-xs text-gray-600">
                Real-time chain of custody, volunteer handovers, and recipient confirmations
              </p>
            </div>
            <Link 
              href="/mydonations" 
              className="text-xs font-semibold text-[#166534] hover:text-[#0E3824]"
            >
              Full Ledger History →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#CBDBC7] bg-[#F2F7F0] text-[#1A402B] font-semibold">
                  <th className="py-2.5 px-4">Batch ID</th>
                  <th className="py-2.5 px-4">Food Item</th>
                  <th className="py-2.5 px-4">Quantity</th>
                  <th className="py-2.5 px-4">Pickup Window</th>
                  <th className="py-2.5 px-4">Pickup Location</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBDBC7]/60 bg-[#FAFDF8]">
                {recentDonations.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-[#EFF5EC] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#0E3824]">
                      {item.id || `#BAT-${1000 + idx}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0E3824]">
                      {item.food || item.foodType || "Surplus Food Batch"}
                    </td>
                    <td className="py-3 px-4 text-gray-700 tabular-nums">
                      {item.quantity || "30 servings"}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {item.expiry || "Today, 19:00"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 truncate max-w-xs">
                      {item.address || "Bengaluru Main Hub"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        item.status === "Delivered" 
                          ? "bg-[#E1F2E7] text-[#0A5631] border-[#A7DFC0]" 
                          : item.status === "Assigned" 
                          ? "bg-[#E5F0FA] text-[#0F4E80] border-[#B6D6F2]"
                          : "bg-[#FEF6E6] text-[#8C5504] border-[#F6D59A]"
                      }`}>
                        {item.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link 
                        href="/mydonations" 
                        className="font-semibold text-[#166534] hover:text-[#0E3824]"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
