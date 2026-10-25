"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { donationsApi } from "@/lib/api-client";

interface Donation {
  id: string;
  title: string;
  food_category: string;
  quantity: number;
  unit: string;
  prepared_at?: string | null;
  expires_at: string;
  pickup_deadline: string;
  status: string;
  pickup_address: string;
  area?: string | null;
  state?: string | null;
  pincode?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-gray-200 text-gray-700";
    case "ASSIGNED":
      return "bg-blue-500 text-white";
    case "PICKED_UP":
      return "bg-yellow-500 text-white";
    case "DELIVERED":
      return "bg-purple-500 text-white";
    case "COMPLETED":
      return "bg-green-800 text-white";
    case "CANCELLED":
      return "bg-red-500 text-white";
    case "EXPIRED":
      return "bg-orange-500 text-white";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

const getStatusLabel = (status: string) => status.replace("_", " ");

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

export default function MyDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await donationsApi.getMine();
        setDonations(res.data.donations);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Error fetching donations");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const handleCancel = async (donation: Donation) => {
    if (
      !confirm(
        `Cancel "${donation.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setCancelling(donation.id);
      const res = await donationsApi.cancel(donation.id);
      const updated = res.data.donation;
      setDonations((prev) =>
        prev.map((item) =>
          item.id === donation.id
            ? { ...item, status: updated.status, updated_at: updated.updated_at }
            : item
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Error cancelling donation");
    } finally {
      setCancelling(null);
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
          Track all your donations, see their status, and manage active
          listings.
        </p>
      </section>

      <section className="py-8 px-6 max-w-4xl mx-auto space-y-6">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your donations...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">{error}</div>
        )}

        {!loading && !error && donations.length === 0 && (
          <p className="text-gray-600 text-center py-12">
            You have not donated any food yet.
            <br />
            <a
              href="/donate"
              className="text-green-600 font-semibold hover:underline mt-2 inline-block"
            >
              Create your first donation →
            </a>
          </p>
        )}

        {!loading &&
          !error &&
          donations.map((donation) => (
            <div
              key={donation.id}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center mb-3 gap-4">
                <h2 className="text-xl font-semibold text-green-700">
                  {donation.title}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    donation.status
                  )}`}
                >
                  {getStatusLabel(donation.status)}
                </span>
              </div>

              {donation.description && (
                <p className="text-gray-700 mb-2">{donation.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <p className="text-gray-700">
                  🥘 {donation.quantity} {donation.unit}
                </p>
                <p className="text-gray-700">
                  🏷️ {donation.food_category}
                </p>
                <p className="text-gray-700">
                  ⏰ Prepared: {formatDate(donation.prepared_at)}
                </p>
                <p className="text-gray-700">
                  ⏳ Expires: {formatDate(donation.expires_at)}
                </p>
              </div>

              <p className="text-gray-700">
                📍 {donation.pickup_address}
                {donation.area ? `, ${donation.area}` : ""}
                {donation.state ? `, ${donation.state}` : ""}
                {donation.pincode ? ` (${donation.pincode})` : ""}
              </p>

              <div className="mt-2 text-sm text-gray-500">
                <p>Pickup by: {formatDate(donation.pickup_deadline)}</p>
                <p>Created: {formatDate(donation.created_at)}</p>
                <p>Last updated: {formatDate(donation.updated_at)}</p>
              </div>

              {["ASSIGNED", "PICKED_UP", "DELIVERED", "COMPLETED"].includes(
                donation.status
              ) && (
                <div className="mt-3 bg-green-50 p-3 rounded border-l-4 border-green-700">
                  <p className="text-gray-700 font-medium">
                    Volunteer assigned
                  </p>
                  <p className="text-gray-700 text-sm">
                    A volunteer is handling this donation. Status updates appear
                    here.
                  </p>
                </div>
              )}

              {["AVAILABLE", "ASSIGNED"].includes(donation.status) && (
                <button
                  onClick={() => handleCancel(donation)}
                  disabled={cancelling === donation.id}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition"
                >
                  {cancelling === donation.id
                    ? "Cancelling..."
                    : "Cancel Donation"}
                </button>
              )}
            </div>
          ))}
      </section>
    </main>
  );
}
