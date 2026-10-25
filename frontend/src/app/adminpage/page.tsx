"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "@/components/volunavbar";
import { adminApi } from "@/lib/api-client";

interface Verification {
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
  users: {
    id: string;
    name: string;
    email: string;
    created_at: string;
  };
}

interface Donation {
  id: string;
  title: string;
  food_category: string;
  quantity: number;
  unit: string;
  prepared_at?: string | null;
  pickup_address: string;
  area?: string | null;
  state?: string | null;
  status: string;
  users?: {
    id: string;
    name: string;
    email: string;
    phonenumber?: string;
  };
  assignments?: Array<{
    id: string;
    volunteer_id: string;
    assigned_at: string;
    picked_up_at?: string;
    delivered_at?: string;
    assignment_status: string;
    users?: {
      id: string;
      name: string;
      email: string;
      phonenumber?: string;
    };
  }>;
  delivery_confirmations?: Array<{
    id: string;
    confirmed_by: string;
    confirmed_at: string;
    users?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
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

const verificationStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-600/20 text-green-400",
  rejected: "bg-red-600/20 text-red-300",
};

const donationStatusColors: Record<string, string> = {
  AVAILABLE: "text-status-available",
  ASSIGNED: "text-status-assigned",
  PICKED_UP: "text-status-assigned",
  DELIVERED: "text-status-assigned",
  COMPLETED: "text-status-completed",
  CANCELLED: "text-status-cancelled",
  EXPIRED: "text-status-cancelled",
};

const donationStatusBgs: Record<string, string> = {
  AVAILABLE: "bg-status-available",
  ASSIGNED: "bg-status-assigned",
  PICKED_UP: "bg-status-assigned",
  DELIVERED: "bg-status-assigned",
  COMPLETED: "bg-status-completed",
  CANCELLED: "bg-status-cancelled",
  EXPIRED: "bg-status-cancelled",
};

const getDonationStatusColor = (status: string) => {
  return donationStatusColors[status] || "text-muted-foreground";
};

const getDonationStatusBg = (status: string) => {
  return donationStatusBgs[status] || "bg-muted";
};

const verificationStatusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const getVerificationStatusClass = (status: string) => verificationStatusColors[status] || "text-muted-foreground/80";

export default function AdminDashboard() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "picked" | "completed" | "cancelled" | "expired">(
    "all"
  );
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [verifRes, donRes] = await Promise.all([
          adminApi.getVerifications(),
          adminApi.getDonations({ limit: 100 }),
        ]);
        setVerifications(verifRes.data.data.verifications);
        setDonations(donRes.data.data.donations);
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message || "Error fetching dashboard data"
        );
      } finally {
        setLoadingVerifications(false);
        setLoadingDonations(false);
      }
    };

    fetchData();
  }, []);

  const pendingCount = useMemo(
    () => verifications.filter((v) => v.verification_status === "pending").length,
    [verifications]
  );

  const approvedCount = useMemo(
    () => verifications.filter((v) => v.verification_status === "approved").length,
    [verifications]
  );

  const activeDonations = useMemo(
    () =>
      donations.filter(
        (d) => ["AVAILABLE", "ASSIGNED", "PICKED_UP", "DELIVERED"].includes(d.status)
      ).length,
    [donations]
  );

  const completedDonations = useMemo(
    () => donations.filter((d) => d.status === "COMPLETED").length,
    [donations]
  );

  const filteredDonations = useMemo(() => {
    return donations
      .filter((d) => {
        if (filter !== "all") {
          const statusMap: Record<string, string[]> = {
            active: ["AVAILABLE", "ASSIGNED", "PICKED_UP", "DELIVERED"],
            picked: ["PICKED_UP"],
            completed: ["COMPLETED"],
            cancelled: ["CANCELLED"],
            expired: ["EXPIRED"],
          };
          if (!statusMap[filter]?.includes(d.status)) return false;
        }
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          d.id.toLowerCase().includes(q) ||
          (d.title || "").toLowerCase().includes(q) ||
          (d.food_category || "").toLowerCase().includes(q) ||
          (d.pickup_address || "").toLowerCase().includes(q) ||
          (d.users?.name || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const statusOrder: Record<string, number> = {
          AVAILABLE: 0,
          ASSIGNED: 1,
          PICKED_UP: 2,
          DELIVERED: 3,
          COMPLETED: 4,
          CANCELLED: 5,
          EXPIRED: 6,
        };
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      });
  }, [donations, filter, query]);

  const handleReview = useCallback(
    async (id: string) => {
      if (!reviewNotes.trim() && reviewDecision === "rejected") {
        alert("Please provide a reason for rejection");
        return;
      }

      try {
        await adminApi.reviewVerification(id, { decision: reviewDecision, notes: reviewNotes });
        setVerifications((prev) =>
          prev.map((v) =>
            v.id === id
              ? { ...v, verification_status: reviewDecision, verification_notes: reviewNotes, verified_at: new Date().toISOString() }
              : v
          )
        );
        setReviewingId(null);
        setReviewNotes("");
        alert(`Verification ${reviewDecision} successfully!`);
      } catch (err: any) {
        alert(err.response?.data?.error?.message || "Error reviewing verification");
      }
    },
    [reviewDecision, reviewNotes]
  );

  const handleExpireDonation = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to manually expire this donation?")) return;

      try {
        await adminApi.expireDonation(id);
        setDonations((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, status: "EXPIRED" } : d
          )
        );
        setSelectedDonation((prev) =>
          prev && prev.id === id ? { ...prev, status: "EXPIRED" } : prev
        );
        alert("Donation expired successfully!");
      } catch (err: any) {
        alert(err.response?.data?.error?.message || "Error expiring donation");
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
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor users, NGO verifications, and food donations in real-time.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <p className="text-3xl font-bold text-status-available mb-2">
                {pendingCount}
              </p>
              <p className="text-muted-foreground/80 mt-1">Pending Verifications</p>
            </div>
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <p className="text-3xl font-bold text-brand-primary mb-2">
                {approvedCount}
              </p>
              <p className="text-muted-foreground/80 mt-1">Approved NGOs</p>
            </div>
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <p className="text-3xl font-bold text-foreground mb-2">
                {activeDonations}
              </p>
              <p className="text-muted-foreground/80 mt-1">Active Donations</p>
            </div>
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <p className="text-3xl font-bold text-status-completed mb-2">
                {completedDonations}
              </p>
              <p className="text-muted-foreground/80 mt-1">Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Requests */}
      <section className="py-8 px-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            NGO Verification Requests
          </h2>
          <p className="text-muted-foreground/80">
            {pendingCount} pending
          </p>
        </div>

        {loadingVerifications ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-status-available/20 border-t-status-available mx-auto"></div>
          </div>
        ) : verifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <svg
              className="mx-auto mb-4 w-12 h-12 text-muted-foreground/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15m-2 0a2 2 0 100-4 2 2 0 100 4m-7-2a2 2 0 11-4 0 2 2 0 114m12 0a2 2 0 100-4 2 2 0 100 4"
              />
            </svg>
            <p className="text-muted-foreground">No verification requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800">
                      {v.organization_name}
                    </h3>
                    <p className="text-sm text-muted-foreground/80">
                      {v.contact_person} • {v.contact_email}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Registered: {new Date(v.users.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerificationStatusClass(
                    v.verification_status
                  )}`}>
                    {getStatusLabel(v.verification_status)}
                  </span>
                </div>

                {reviewingId === v.id && (
                  <div className="mt-4 p-4 rounded-lg bg-muted">
                    <h4 className="font-medium mb-2">Review Verification</h4>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="approved"
                          checked={reviewDecision === "approved"}
                          onChange={(e) =>
                            setReviewDecision(e.target.value as "approved" | "rejected")
                          }
                          className="text-status-available"
                        />
                        <span>Approve</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="rejected"
                          checked={reviewDecision === "rejected"}
                          onChange={(e) =>
                            setReviewDecision(e.target.value as "approved" | "rejected")
                          }
                          className="text-status-cancelled"
                        />
                        <span>Reject</span>
                      </label>
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm text-muted-foreground/80 mb-1">
                        Notes (required for rejection):
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border-border focus-ring-primary focus:border-primary p-2"
                        required={reviewDecision === "rejected"}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(v.id)}
                        className="flex-1 px-4 py-2 bg-brand-primary rounded-lg text-white font-medium hover:bg-brand-primary/90 transition disabled:bg-surface"
                        disabled={!reviewNotes.trim() && reviewDecision === "rejected"}
                      >
                        Submit Decision
                      </button>
                      <button
                        onClick={() => setReviewingId(null)}
                        className="flex-1 px-4 py-2 border border-border rounded-lg text-gray-700 hover:bg-surface transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {v.verification_notes && (
                  <div className="mt-3 p-3 rounded-lg bg-surface/50 text-sm">
                    <strong>Admin Notes:</strong>{" "}{v.verification_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Donation Management */}
      <section className="py-8 px-6 max-w-6xl mx-auto">
        {/* Filters & Search */}
        <div className="bg-white rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search donations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border-border focus-ring-primary focus:border-primary"
            />
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "active" | "picked" | "completed" | "cancelled" | "expired")
              }
              className="px-4 py-2 rounded-lg border-border focus-ring-primary focus:border-primary"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="picked">Picked Up</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-cancelled/20 text-status-cancelled text-sm">
            {error}
          </div>
        )}

        {loadingDonations && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-status-available/20 border-t-status-available mx-auto"></div>
            <p className="text-muted-foreground/80 mt-2">Loading donations...</p>
          </div>
        )}

        {/* Donation List & Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List */}
          <div className="col-span-2">
            {/* Donation items rendered below */}
          </div>

          {/* Details Panel */}
          <div className="bg-white rounded-2xl p-6 h-fit">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Details</h3>
            {loadingDetails && (
              <p className="text-muted-foreground/80 text-sm">Loading details...</p>
            )}
            {selectedDonation ? (
              <div className="space-y-4 text-sm text-muted-foreground/80">
                <p><strong>ID:</strong> {selectedDonation.id}</p>
                <p><strong>Title:</strong> {selectedDonation.title}</p>
                <p><strong>Category:</strong> {selectedDonation.food_category}</p>
                <p><strong>Quantity:</strong> {selectedDonation.quantity} {selectedDonation.unit}</p>
                <p>
                  <strong>Donor:</strong>{" "}{selectedDonation.users?.name || "—"}
                  {" "}{selectedDonation.users?.email || "—"}
                </p>
                <p><strong>Prepared:</strong> {formatDate(selectedDonation.prepared_at)}</p>
                <p>
                  <strong>Location:</strong>{" "}{selectedDonation.pickup_address}
                  {selectedDonation.area ? `, ${selectedDonation.area}` : ""}
                  {selectedDonation.state ? `, ${selectedDonation.state}` : ""}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getDonationStatusColor(
                    selectedDonation.status
                  )} ${getDonationStatusBg(selectedDonation.status)}`}>
                    {selectedDonation.status}
                  </span>
                </p>

                {(selectedDonation.assignments?.length ?? 0) > 0 && (
                  <div>
                    <p className="font-medium mb-2">Assignments:</p>
                    {selectedDonation.assignments?.map((a) => (
                      <div key={a.id} className="ml-4">
                        <p>Volunteer: {a.users?.name || "—"} ({a.users?.email || "—"})</p>
                        <p>Assigned: {formatDate(a.assigned_at)}</p>
                        <p>Status: {a.assignment_status}</p>
                        {a.picked_up_at && (
                          <p>Picked up: {formatDate(a.picked_up_at)}</p>
                        )}
                        {a.delivered_at && (
                          <p>Delivered: {formatDate(a.delivered_at)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(selectedDonation.delivery_confirmations?.length ?? 0) > 0 && (
                  <div>
                    <p className="font-medium mb-2">Confirmations:</p>
                    {selectedDonation.delivery_confirmations?.map((c) => (
                      <div key={c.id} className="ml-4">
                        <p>Confirmed by: {c.users?.name || "—"} ({c.users?.email || "—"})</p>
                        <p>At: {formatDate(c.confirmed_at)}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(JSON.stringify(selectedDonation, null, 2))
                    }
                    className="flex-1 px-3 py-2 bg-brand-primary rounded-lg text-white font-medium hover:bg-brand-primary/90 transition"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => setSelectedDonation(null)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-gray-700 hover:bg-surface transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground/80 text-sm">
                Select a donation to view details
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

type DonationStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

