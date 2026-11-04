"use client";

import { useState, useEffect } from "react";
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
    <main className="min-h-screen bg-green-50">
      <Navbar />

      <section className="py-16 px-6 text-center bg-green-100">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          My Donations 🍲
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Track all your donations, see their status, and know which volunteers
          accepted them.
        </p>
      </section>

      <section className="py-8 px-6 max-w-4xl mx-auto space-y-6">
        {loading && (
          <p className="text-center text-gray-500 py-8">Loading your donation history...</p>
        )}

        {!loading &&
          donations.map((donation) => (
            <div
              key={donation.id}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition border border-green-100"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-green-700">
                  {donation.food}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      donation.status === "Pending"
                        ? "bg-gray-200 text-gray-700"
                        : donation.status === "Accepted"
                        ? "bg-blue-500 text-white"
                        : donation.status === "Picked"
                        ? "bg-yellow-500 text-white"
                        : "bg-green-700 text-white"
                    }`}
                  >
                    {donation.status}
                  </span>
                  {donation.status === "Pending" && (
                    <button
                      onClick={() => handleCancel(donation.id)}
                      className="text-xs text-red-600 hover:text-red-800 underline ml-2 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <p className="text-gray-700 text-sm mt-1">🥘 Servings: {donation.servings}</p>
              <p className="text-gray-700 text-sm mt-1">⏰ Preparation Time: {donation.prepTime}</p>
              <p className="text-gray-700 text-sm mt-1">📍 Location: {donation.location}</p>
              <p className="text-gray-700 text-sm mt-1">⏱️ Best Before: {donation.bestBefore}</p>

              {donation.volunteer && (
                <div className="mt-4 bg-green-50 p-3 rounded-md border-l-4 border-green-700 text-sm">
                  <p className="text-green-900 font-semibold mb-1">Courier Assigned:</p>
                  <p className="text-gray-700">👤 Name: {donation.volunteer}</p>
                  {donation.volunteerPhone && (
                    <p className="text-gray-700">📞 Phone: {donation.volunteerPhone}</p>
                  )}
                </div>
              )}
            </div>
          ))}

        {!loading && donations.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm p-8 border border-green-100">
            <p className="text-gray-600 text-lg mb-4">You have not donated any food yet.</p>
            <a
              href="/donate"
              className="inline-block bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-medium transition"
            >
              Make Your First Donation
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
