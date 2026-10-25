"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { impactApi } from "@/lib/api-client";

interface DashboardStats {
  totalDonations: number;
  byStatus: Record<string, number>;
  completedQuantity: number;
  activeDonations: number;
  completedDonations: number;
}

export default function DonorDashboard() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        try {
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
          );
          const data = await res.json();

          if (data.results.length > 0) {
            const details = data.results[0].components;
            const formatted = `
              ${details.road || ""}, 
              ${details.suburb || ""}, 
              ${details.city || details.town || details.village || ""}, 
              ${details.state || ""}, 
              ${details.postcode || ""}, 
              ${details.country || ""}
            `;
            setAddress(formatted.trim());
          }
        } catch (err) {
          console.error("Error fetching location details:", err);
          alert("Failed to fetch address details.");
        }
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Fetch donor dashboard stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await impactApi.getDonorStats();
        setStats(res.data.stats);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero / Intro Section */}
      <section className="bg-green-100 py-16 px-6 text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          Together Against Food Waste
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Connecting restaurants, caterers, and donors with volunteers to reduce
          food waste and feed the needy. Be part of the change.
        </p>
      </section>

      {/* Location Section */}
      <section className="py-8 px-6 text-center bg-green-50">
        <h2 className="text-2xl font-semibold mb-4">
          📍 Use Your Current Location
        </h2>
        <button
          onClick={getLocation}
          className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg shadow-md transition-all hover:scale-105"
        >
          Get Location
        </button>

        {coords && (
          <div className="mt-6 p-4 bg-white rounded shadow-md max-w-md mx-auto text-left">
            <p>
              <strong>Latitude:</strong> {coords.lat}
            </p>
            <p>
              <strong>Longitude:</strong> {coords.lng}
            </p>
            <p>
              <strong>Address:</strong> {address || "Fetching..."}
            </p>
          </div>
        )}
      </section>

      {/* Donate Button Section */}
      <section className="py-8 px-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Ready to Donate?</h2>
        <Link href="/donate">
          <button className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg shadow-md transition-all hover:scale-105">
            Donate Food Now
          </button>
        </Link>
      </section>

      {/* My Donations Quick Link */}
      <section className="py-8 px-6 text-center">
        <Link href="/mydonations" className="inline-block">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all hover:scale-105">
            View My Donations
          </button>
        </Link>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-6 text-center bg-green-100">
        <h2 className="text-2xl font-semibold mb-8">Your Impact So Far</h2>
        <div className="flex flex-col md:flex-row justify-center gap-6">
          <div className="bg-white shadow-md p-6 rounded-lg w-56 text-center hover:shadow-lg transition-all">
            <p className="text-3xl font-bold text-green-700">
              {stats?.completedQuantity || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Total Quantity Donated (mixed units)
            </p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-56 text-center hover:shadow-lg transition-all">
            <p className="text-3xl font-bold text-green-700">
              {stats?.completedDonations || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Completed Donations</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-56 text-center hover:shadow-lg transition-all">
            <p className="text-3xl font-bold text-green-700">
              {stats?.activeDonations || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active Listings</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-56 text-center hover:shadow-lg transition-all">
            <p className="text-3xl font-bold text-green-700">
              {stats?.totalDonations || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Listings</p>
          </div>
        </div>

        {/* Status breakdown */}
        {stats && Object.keys(stats.byStatus).length > 0 && (
          <div className="mt-10 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Donation Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-700">{count}</p>
                  <p className="text-xs text-gray-600 capitalize">{status.toLowerCase().replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}