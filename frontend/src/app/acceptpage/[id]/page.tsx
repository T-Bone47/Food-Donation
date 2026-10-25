"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/volunavbar";
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
  pickup_address: string;
  area?: string | null;
  state?: string | null;
  pincode?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  recipient_ngo_id?: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const STEPS = ["ASSIGNED", "PICKED_UP", "DELIVERED", "COMPLETED"];

export default function AcceptPage() {
  const params = useParams();
  const router = useRouter();
  const donationId = params.id as string;

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await donationsApi.getById(donationId);
        setDonation(res.data.donation);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Error fetching donation");
      } finally {
        setLoading(false);
      }
    };

    if (donationId) fetchDonation();
  }, [donationId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading donation details...</p>
        </div>
      </main>
    );
  }

  if (error || !donation) {
    return (
      <main className="min-h-screen bg-green-50">
        <Navbar />
        <div className="text-center py-20 px-6">
          <p className="text-red-500">{error || "Donation not found"}</p>
          <button
            onClick={() => router.push("/volunteer/tasks")}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Back to My Tasks
          </button>
        </div>
      </main>
    );
  }

  const currentIndex = STEPS.indexOf(donation.status);
  const isTerminal = ["COMPLETED", "CANCELLED", "EXPIRED"].includes(
    donation.status
  );

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <Navbar />

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-green-800">
            Pickup Tracking 🚴‍♂️
          </h1>
          <Link
            href="/volunteer/tasks"
            className="text-sm text-green-700 hover:underline"
          >
            ← Back to tasks
          </Link>
        </div>

        <div className="bg-white shadow-md p-6 rounded-lg mb-6 space-y-2">
          <div className="flex justify-between items-start gap-4">
            <h2 className="text-xl font-bold text-green-700">
              {donation.title}
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {donation.status.replace("_", " ")}
            </span>
          </div>
          {donation.description && (
            <p className="text-gray-700">{donation.description}</p>
          )}
          <p className="text-gray-700">
            📍 {donation.pickup_address}
            {donation.area ? `, ${donation.area}` : ""}
            {donation.state ? `, ${donation.state}` : ""}
            {donation.pincode ? ` (${donation.pincode})` : ""}
          </p>
          <p className="text-gray-700">🏷️ {donation.food_category}</p>
          <p className="text-gray-700">
            🥘 {donation.quantity} {donation.unit}
          </p>
          <p className="text-gray-700">
            ⏰ Prepared: {formatDate(donation.prepared_at)}
          </p>
          <p className="text-gray-700">
            ⏳ Expires: {formatDate(donation.expires_at)}
          </p>
          <p className="text-gray-700">
            🕐 Pickup by: {formatDate(donation.pickup_deadline)}
          </p>
        </div>

        <div className="bg-green-100 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            Delivery Progress
          </h3>
          <div className="flex gap-2 mb-4">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`flex-1 p-2 rounded-md text-center text-xs md:text-sm font-medium ${
                  currentIndex >= index
                    ? "bg-green-600 text-white"
                    : "bg-white border text-gray-600"
                }`}
              >
                {step.replace("_", " ")}
              </div>
            ))}
          </div>

          {isTerminal ? (
            <p className="text-green-900 font-medium text-center py-2">
              {donation.status === "COMPLETED"
                ? "✅ Completed — receipt confirmed by the NGO"
                : `Donation ${donation.status.toLowerCase()}`}
            </p>
          ) : (
            <p className="text-sm text-gray-700 text-center">
              Update pickup and delivery from{" "}
              <Link href="/volunteer/tasks" className="text-green-700 underline">
                My Tasks
              </Link>
              .
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            Pickup Location
          </h3>
          {donation.latitude != null && donation.longitude != null ? (
            <>
              <iframe
                src={`https://www.google.com/maps?q=${donation.latitude},${donation.longitude}&z=15&output=embed`}
                width="100%"
                height="300"
                loading="lazy"
                className="w-full rounded-lg"
                title="Pickup location map"
              ></iframe>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${donation.latitude},${donation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-green-700 hover:underline"
              >
                Open in Google Maps →
              </a>
            </>
          ) : (
            <div className="w-full h-40 bg-green-200 rounded-lg flex items-center justify-center text-green-900">
              <p>Location coordinates not available</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
