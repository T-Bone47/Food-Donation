"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/volunavbar";
import { ngoApi, donationsApi } from "@/lib/api-client";

interface NGOProfile {
  id: string;
  organization_name: string;
  registration_number: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  description?: string;
  verification_status: "pending" | "approved" | "rejected";
  verification_notes?: string;
  verified_at?: string;
  totalCompletedDonations: number;
  totalPickups: number;
  totalDelivered: number;
  totalExpired: number;
}

interface Delivery {
  id: string;
  title: string;
  food_category: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  area?: string | null;
  state?: string | null;
  pincode?: string | null;
  prepared_at?: string | null;
  expires_at: string;
  pickup_deadline: string;
  status: string;
  delivery_confirmations?: Array<{ confirmed_at: string }>;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const getStatusLabel = (status: string) => {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

type DonationStatus = "AVAILABLE" | "ASSIGNED" | "PICKED_UP" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "EXPIRED";

const verificationStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-600/20 text-green-400",
  rejected: "bg-red-600/20 text-red-300",
};

const donationStatusColors: Record<DonationStatus, string> = {
  AVAILABLE: "text-status-available",
  ASSIGNED: "text-status-assigned",
  PICKED_UP: "text-status-assigned",
  DELIVERED: "text-status-assigned",
  COMPLETED: "text-status-completed",
  CANCELLED: "text-status-cancelled",
  EXPIRED: "text-status-cancelled",
};

const donationStatusBgs: Record<DonationStatus, string> = {
  AVAILABLE: "bg-status-available",
  ASSIGNED: "bg-status-assigned",
  PICKED_UP: "bg-status-assigned",
  DELIVERED: "bg-status-assigned",
  COMPLETED: "bg-status-completed",
  CANCELLED: "bg-status-cancelled",
  EXPIRED: "bg-status-cancelled",
};

const getDonationStatusColor = (status: string) => {
  return donationStatusColors[status as DonationStatus] || "text-muted-foreground";
};

const getDonationStatusBg = (status: string) => {
  return donationStatusBgs[status as DonationStatus] || "bg-muted";
};

const getVerificationStatusClass = (status: string) => verificationStatusColors[status] || "text-muted-foreground/80";

export default function NGODashboard() {
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [history, setHistory] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, deliveriesRes, historyRes] = await Promise.all([
          ngoApi.getVerificationStatus(),
          ngoApi.getIncomingDeliveries(),
          ngoApi.getHistory(),
        ]);

        setProfile(profileRes.data.data.profile);
        setDeliveries(deliveriesRes.data.data.deliveries || []);
        setHistory(historyRes.data.data.history || []);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Error fetching dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitVerification = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setVerificationLoading(true);

      const formData = new FormData(e.currentTarget);
      const data = {
        organization_name: formData.get("organization_name") as string,
        registration_number: formData.get("registration_number") as string,
        address: formData.get("address") as string,
        contact_person: formData.get("contact_person") as string,
        contact_email: formData.get("contact_email") as string,
        contact_phone: formData.get("contact_phone") as string,
        description: formData.get("description") as string,
      };

      try {
        await ngoApi.submitVerification(data);
        setShowVerificationForm(false);
        // Refetch profile
        const res = await ngoApi.getVerificationStatus();
        setProfile(res.data.profile);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Error submitting verification");
      } finally {
        setVerificationLoading(false);
      }
    },
    []
  );

  const handleConfirmReceipt = useCallback(
    async (donationId: string) => {
      if (!confirm("Confirm that this delivery has been received?")) return;

      try {
        await donationsApi.confirmReceipt(donationId);
        setDeliveries((prev) => prev.filter((d) => d.id !== donationId));
        const historyRes = await ngoApi.getHistory();
        setHistory(historyRes.data.data.history || []);
        alert("Receipt confirmed successfully!");
      } catch (err: any) {
        alert(err.response?.data?.error?.message || "Error confirming receipt");
      }
    },
    []
  );

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-[color-surface] to-[color-card] px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-brand-primary mb-4">
            NGO Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage incoming deliveries and confirm receipt.
          </p>
        </div>
      </section>

      {/* Impact Section */}
      {!loading && (
        <section className="py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-semibold text-brand-primary mb-8 text-center">
              Impact Metrics
            </h2>

            {profile && profile.verification_status === "approved" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto">
                <div className="card p-6 text-center hover:shadow-lg transition-shadow">
                  <p className="text-3xl font-bold text-status-completed">
                    {profile.totalCompletedDonations || 0}
                  </p>
                  <p className="text-muted-foreground/80 mt-1">Completed Deliveries</p>
                </div>
                <div className="card p-6 text-center hover:shadow-lg transition-shadow">
                  <p className="text-3xl font-bold text-brand-primary">
                    {profile.totalPickups || 0}
                  </p>
                  <p className="text-muted-foreground/80 mt-1">Total Pickups</p>
                </div>
                <div className="card p-6 text-center hover:shadow-lg transition-shadow">
                  <p className="text-3xl font-bold text-foreground">
                    {profile.totalDelivered || 0}
                  </p>
                  <p className="text-muted-foreground/80 mt-1">Total Delivered</p>
                </div>
                <div className="card p-6 text-center hover:shadow-lg transition-shadow">
                  <p className="text-3xl font-bold text-status-cancelled">
                    {profile.totalExpired || 0}
                  </p>
                  <p className="text-muted-foreground/80 mt-1">Expired</p>
                </div>
              </div>
            )}

            {!profile || profile.verification_status !== "approved" && (
              <div className="card p-6 text-center bg-status-available/20 rounded-xl mb-6">
                <p className="text-3xl font-bold text-status-available mb-2">
                  0
                </p>
                <p className="text-muted-foreground/80">
                  Register & Get Started to See Impact
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Verification Status */}
      <section className="py-8 px-6 max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Verification Status
          </h2>
          {profile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-lg font-medium ${getVerificationStatusClass(profile.verification_status)}`}>
                  {getStatusLabel(profile.verification_status)}
                </span>
                {profile.verified_at && (
                  <span className="text-sm text-muted-foreground/80">
                    Verified: {new Date(profile.verified_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground/80">
                <div>
                  <p>Organization</p>
                  <p className="font-medium">{profile.organization_name}</p>
                </div>
                <div>
                  <p>Registration No.</p>
                  <p className="font-medium">{profile.registration_number}</p>
                </div>
                <div>
                  <p>Contact Person</p>
                  <p className="font-medium">{profile.contact_person}</p>
                </div>
                <div>
                  <p>Contact Email</p>
                  <p className="font-medium">{profile.contact_email}</p>
                </div>
              </div>
              {profile.verification_notes && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm"><strong>Admin Notes:</strong>{" "}{profile.verification_notes}</p>
                </div>
              )}
              {profile.verification_status === "rejected" && (
                <button
                  onClick={() => setShowVerificationForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-status-available/20 rounded-lg text-status-available hover:text-status-available/90 transition"
                >
                  Resubmit Verification
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground/80 mb-4">
                Your NGO is not yet verified.
              </p>
              <button
                onClick={() => setShowVerificationForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary rounded-lg text-white font-medium hover:bg-brand-primary/90 transition"
              >
                Submit Verification
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Verification Form Modal */}
      {showVerificationForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
              Submit NGO Verification
            </h2>
            <form onSubmit={handleSubmitVerification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization Name *
                </label>
                <input
                  name="organization_name"
                  type="text"
                  required
                  defaultValue={profile?.organization_name || ""}
                  className="mt-1 w-full rounded-lg border-border focus-ring-primary focus:border-primary p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Registration Number *
                </label>
                <input
                  name="registration_number"
                  type="text"
                  required
                  defaultValue={profile?.registration_number || ""}
                  className="mt-1 w-full rounded-lg border-border focus-ring-primary focus:border-primary p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  defaultValue={profile?.address || ""}
                  className="mt-1 w-full rounded-lg border-border focus-ring-primary focus:border-primary p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Person *
                </label>
                <input
                  name="contact_person"
                  type="text"
                  required
                  defaultValue={profile?.contact_person || ""}
                  className="mt-1 w-full rounded-lg border-border focus-ring-primary focus:border-primary p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Email *
                </label>
                <input
                  name="contact_email"
                  type="email"
                  required
                  defaultValue={profile?.contact_email || ""}
                  className="mt-1 w-full rounded-lg border-border focus-ring-primary focus:border-primary p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Phone *
                </label>
                <input
                  name="contact_phone"
                  type="tel"
                  required
                  defaultValue={profile?.contact_phone || ""}
                  className="mt-1 w-full rounded-lg border-border focus-ring-primary focus:border-primary p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={profile?.description || ""}
                  className="mt-1 w-full rounded-lg border-border focus-ring-primary focus:border-primary p-3"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowVerificationForm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-gray-700 hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verificationLoading}
                  className="flex-1 px-4 py-2 bg-brand-primary rounded-lg text-white font-medium hover:bg-brand-primary/90 transition disabled:bg-surface"
                >
                  {verificationLoading ? "Submitting..." : "Submit Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incoming Deliveries */}
      <section className="py-8 px-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Incoming Deliveries
        </h2>

        {loading ? (
          <p className="text-muted-foreground">Loading deliveries...</p>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <svg
              className="mx-auto mb-4 w-12 h-12 text-muted-foreground/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15m-2 0a2 2 0 100-4 2 2 0 100 4m-7-2a2 2 0 11-4 0 2 2 0 114m12 0a2 2 0 100-4 2 2 0 100 4"
              />
            </svg>
            <p className="text-muted-foreground mb-2">
              No incoming deliveries awaiting confirmation.
            </p>
            <button
              className="px-4 py-2 bg-brand-primary rounded-lg text-white font-medium hover:bg-brand-primary/90 transition"
            >
              Donate Food Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-white rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {delivery.title}
                    </h3>
                    <p className="text-muted-foreground/80 mt-1">
                      📍{" "}{[delivery.area, delivery.state].filter(Boolean).join(", ")} ||
                      "Location not specified"{delivery.pincode ? ` (${delivery.pincode})` : ""}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDonationStatusColor(delivery.status)} ${getDonationStatusBg(delivery.status)}`}>
                    {getStatusLabel(delivery.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm text-muted-foreground/80">
                  <div>
                    <p>Quantity</p>
                    <p className="font-medium">{delivery.quantity} {delivery.unit}</p>
                  </div>
                  <div>
                    <p>Category</p>
                    <p className="font-medium">{delivery.food_category}</p>
                  </div>
                  <div>
                    <p>Prepared</p>
                    <p className="font-medium">
                      {formatDate(delivery.prepared_at)}
                    </p>
                  </div>
                  <div>
                    <p>Pickup by</p>
                    <p className="font-medium">
                      {formatDate(delivery.pickup_deadline)}
                    </p>
                  </div>
                </div>

                {delivery.status !== "DELIVERED" && delivery.status !== "COMPLETED" ? (
                  <button
                    onClick={() => handleConfirmReceipt(delivery.id)}
                    className="w-full px-4 py-3 rounded-2xl bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition disabled:bg-surface"
                    disabled={delivery.status !== "AVAILABLE"}
                  >
                    {delivery.status === "AVAILABLE"
                      ? "Confirm Receipt ✅"
                      : delivery.status === "PICKED_UP"
                      ? "Mark as Delivered"
                      : "Confirm Completion"}
                  </button>
                ) : (
                  <div className="w-full px-4 py-3 rounded-2xl bg-green-100 text-green-800 font-medium text-sm">
                    Already confirmed
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Delivery History */}
      <section className="py-8 px-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Delivery History
        </h2>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <svg
              className="mx-auto mb-4 w-12 h-12 text-muted-foreground/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15m-2 0a2 2 0 100-4 2 2 0 100 4m-7-2a2 2 0 11-4 0 2 2 0 114m12 0a2 2 0 100-4 2 2 0 100 4"
              />
            </svg>
            <p className="text-muted-foreground mb-2">
              No completed deliveries have been confirmed yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-border flex justify-between items-center gap-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground/80">
                    {item.quantity} {item.unit} • {item.food_category}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Confirmed:{" "}
                    {item.delivery_confirmations?.[0]?.confirmed_at ? formatDate(item.delivery_confirmations[0].confirmed_at) : "pending"}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-status-completed/20 text-status-completed">
                  COMPLETED
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}