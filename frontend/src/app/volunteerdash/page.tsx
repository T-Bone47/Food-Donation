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

  return (
    <main className="min-h-screen bg-green-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-green-100 py-16 px-6 text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          Be a Food Rescue Hero
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          See nearby donations, accept pickups, and help reduce food waste.
        </p>
      </section>

      {/* Donations Section */}
      <section className="py-10 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Nearby Food Donations 🍲
        </h2>

        {loading && (
          <p className="text-center text-gray-500 py-8">Scanning for nearby surplus food batches...</p>
        )}
        {error && <p className="text-center text-red-500 py-4">{error}</p>}

        {!loading && donations.length === 0 && (
          <div className="text-center bg-white p-8 rounded-xl shadow-xs border border-green-100 max-w-md mx-auto">
            <p className="text-gray-600">No open donations waiting for courier claim right now.</p>
          </div>
        )}

        {!loading && donations.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((item) => (
              <DonationCard key={item.id} donation={item} onClaimed={handleClaimed} />
            ))}
          </div>
        )}
      </section>

      {/* Impact Section */}
      <section className="py-16 px-6 text-center bg-green-100">
        <h2 className="text-2xl font-semibold mb-8 text-green-900">Your Impact 💪</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 max-w-4xl mx-auto">
          <div className="bg-white shadow-md p-6 rounded-lg w-64 text-center hover:shadow-lg transition-all border border-green-100">
            <p className="text-3xl font-bold text-green-700">245</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Meals Picked Up</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-64 text-center hover:shadow-lg transition-all border border-green-100">
            <p className="text-3xl font-bold text-green-700">58 km</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Distance Covered</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-64 text-center hover:shadow-lg transition-all border border-green-100">
            <p className="text-3xl font-bold text-green-700">120</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Reward Points</p>
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="py-10 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Volunteer Rewards 🏆</h2>
        <p className="text-gray-700 mb-6 text-sm">
          Earn badges & points for every pickup completed.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <span className="bg-amber-400 px-5 py-2.5 rounded-full text-white font-bold shadow-md text-sm">
            🥇 Gold Rescuer
          </span>
          <span className="bg-slate-400 px-5 py-2.5 rounded-full text-white font-bold shadow-md text-sm">
            🥈 Silver Rescuer
          </span>
          <span className="bg-amber-600 px-5 py-2.5 rounded-full text-white font-bold shadow-md text-sm">
            🥉 Bronze Rescuer
          </span>
        </div>
      </section>
    </main>
  );
}
