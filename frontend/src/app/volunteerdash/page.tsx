"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/volunavbar";
import { donationsApi, volunteerApi } from "@/lib/api-client";

interface Donation {
  id: string;
  food_category: string;
  quantity: number;
  unit: string;
  prepared_at?: string | null;
  pincode?: string | null;
  area?: string | null;
  state?: string | null;
  status: string;
  title?: string;
  description?: string;
  expires_at?: string;
  pickup_deadline?: string;
}

interface VolunteerStats {
  totalPickups: number;
  totalQuantity: number;
  activeAssignment: {
    donationId: string;
    pickedUp: boolean;
    delivered: boolean;
  } | null;
}

export default function VolunteerDashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch available donations when page loads
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await donationsApi.getAvailable();
        setDonations(res.data.donations);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Error fetching donations");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  // Fetch volunteer stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await volunteerApi.getDashboard();
        setStats(res.data.stats);
      } catch (err) {
        console.error("Error fetching volunteer stats:", err);
      }
    };

    fetchStats();
  }, []);

  const handleClaim = async (donationId: string) => {
    if (!donationId) {
      alert("Invalid donation ID");
      return;
    }

    try {
      setUpdating(donationId);
      await donationsApi.claim(donationId);

      setDonations((prevDonations) =>
        prevDonations.map((donation) =>
          donation.id === donationId
            ? { ...donation, status: "ASSIGNED" }
            : donation
        )
      );

      alert("Donation claimed successfully!");
      window.location.reload();
    } catch (err: any) {
      console.error("Claim Error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.error?.message || "Error claiming donation";
      alert(errorMsg);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "text-red-500";
      case "ASSIGNED":
      case "PICKED_UP":
      case "DELIVERED":
        return "text-yellow-500";
      case "COMPLETED":
        return "text-green-600";
      case "CANCELLED":
      case "EXPIRED":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ');
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
          See nearby donations, claim pickups, and help reduce food waste.
        </p>
      </section>

      {/* Donations Section */}
      <section className="py-10 px-6">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Nearby Food Donations 🍲
        </h2>

        {loading && (
          <p className="text-center text-gray-500">Loading donations...</p>
        )}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && donations.length === 0 && (
          <p className="text-center text-gray-500">
            No nearby donations available at the moment.
          </p>
        )}

        {!loading && !error && donations.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((item) => (
              <div
                key={item.id}
                className="bg-white shadow-md p-6 rounded-lg hover:shadow-lg transition-all"
              >
                <h3 className="text-xl font-bold text-green-700">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-gray-600 mt-1 text-sm">{item.description}</p>
                )}
                <p className="text-gray-600 mt-1">
                  📍{" "}
                  {[item.area, item.state].filter(Boolean).join(", ") ||
                    "Location not specified"}
                  {item.pincode ? ` (${item.pincode})` : ""}
                </p>
                <p className="text-gray-600 mt-1">
                  🏷️ {item.food_category}
                </p>
                <p className="text-gray-600 mt-1">
                  ⏰ Prepared:{" "}
                  {item.prepared_at
                    ? new Date(item.prepared_at).toLocaleString()
                    : "Not specified"}
                </p>
                <p className="text-gray-600 mt-1">
                  📦 Quantity: {item.quantity} {item.unit}
                </p>
                {item.expires_at && (
                  <p className="text-gray-600 mt-1">
                    ⏳ Expires: {new Date(item.expires_at).toLocaleString()}
                  </p>
                )}
                {item.pickup_deadline && (
                  <p className="text-gray-600 mt-1">
                    🕐 Pickup by: {new Date(item.pickup_deadline).toLocaleString()}
                  </p>
                )}
                <p
                  className={`mt-2 font-medium ${getStatusColor(item.status)}`}
                >
                  Status: {getStatusLabel(item.status)}
                </p>

                {item.status === "AVAILABLE" && (
                  <button
                    onClick={() => handleClaim(item.id)}
                    disabled={updating === item.id}
                    className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition"
                  >
                    {updating === item.id ? "Claiming..." : "Claim This Donation"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Impact Section */}
      <section className="py-16 px-6 text-center bg-green-100">
        <h2 className="text-2xl font-semibold mb-8">Your Impact 💪</h2>
        <div className="flex flex-col md:flex-row justify-center gap-6">
          <div className="bg-white shadow-md p-6 rounded-lg w-56 text-center hover:shadow-lg transition-all">
            <p className="text-3xl font-bold text-green-700">
              {stats?.totalPickups || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Completed Pickups</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-56 text-center hover:shadow-lg transition-all">
            <p className="text-3xl font-bold text-green-700">
              {stats?.totalQuantity || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Quantity Delivered</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-56 text-center hover:shadow-lg transition-all">
            <p className="text-3xl font-bold text-green-700">
              {stats?.activeAssignment ? "Active" : "Available"}
            </p>
            <p className="text-sm text-gray-600 mt-1">Current Status</p>
          </div>
        </div>
      </section>

      {/* Active Assignment */}
      {stats?.activeAssignment && (
        <section className="py-10 px-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Active Assignment 📋</h2>
          <div className="max-w-md mx-auto bg-white shadow-md p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>Donation ID:</strong> {stats.activeAssignment.donationId.slice(0, 8)}...
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Picked Up:</strong>{" "}
              <span className={stats.activeAssignment.pickedUp ? "text-green-600" : "text-red-500"}>
                {stats.activeAssignment.pickedUp ? "Yes ✅" : "No"}
              </span>
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Delivered:</strong>{" "}
              <span className={stats.activeAssignment.delivered ? "text-green-600" : "text-red-500"}>
                {stats.activeAssignment.delivered ? "Yes ✅" : "No"}
              </span>
            </p>
            <Link href="/volunteer/tasks" className="inline-block mt-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                View Task Details
              </button>
            </Link>
          </div>
        </section>
      )}

      {/* My Tasks Link */}
      <section className="py-10 px-6 text-center">
        <Link href="/volunteer/tasks" className="inline-block">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all hover:scale-105">
            View My Tasks
          </button>
        </Link>
      </section>
    </main>
  );
}