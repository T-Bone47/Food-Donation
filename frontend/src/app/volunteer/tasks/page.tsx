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

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "text-status-available";
    case "ASSIGNED":
    case "PICKED_UP":
    case "DELIVERED":
      return "text-status-assigned";
    case "COMPLETED":
      return "text-status-completed";
    case "CANCELLED":
    case "EXPIRED":
      return "text-status-cancelled";
    default:
      return "text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  return status.replace("_", " ");
};

export default function VolunteerTasksPage() {
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
      const errorMsg =
        err.response?.data?.error?.message || "Error claiming donation";
      alert(errorMsg);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-[color-surface] to-[color-card] px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-brand-primary mb-4">
            Be a Food Rescue Hero
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See nearby donations, claim pickups, and help reduce food waste.
          </p>
        </div>
      </section>

      {/* Donations Section */}
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Nearby Food Donations 🍲
          </h2>

          {loading && (
            <p className="text-center text-muted-foreground">Loading donations...</p>
          )}

          {error && <p className="text-center text-error">{error}</p>}

          {!loading && !error && donations.length === 0 && (
            <div className="empty-state p-12 text-center">
              <svg
                className="mx-auto mb-4 w-16 h-16 text-muted-foreground/60"
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
              <h3 className="text-xl font-medium text-foreground mb-2">
                No nearby donations available
              </h3>
              <p className="text-muted-foreground/60 mb-6">
                There are no food donations available for pickup at the moment.
              </p>
              <Link href="/donate">
                <button className="btn-primary">
                  Donate Food Now
                </button>
              </Link>
            </div>
          )}

          {!loading && !error && donations.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.map((item) => (
                <div
                  key={item.id}
                  className="card p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-muted-foreground/80 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="text-muted-foreground/80 mb-3">
                    📍{" "}{[item.area, item.state].filter(Boolean).join(", ")} ||
                    "Location not specified"{item.pincode ? ` (${item.pincode})` : ""}
                  </p>
                  <p className="text-muted-foreground/80 mb-3">
                    🏷️ {item.food_category}
                  </p>
                  <p className="text-muted-foreground/80 mb-3">
                    ⏰ Prepared:{" "}{item.prepared_at
                      ? new Date(item.prepared_at).toLocaleString()
                      : "Not specified"}
                  </p>
                  <p className="text-muted-foreground/80 mb-3">
                    📦 Quantity: {item.quantity} {item.unit}
                  </p>
                  {item.expires_at && (
                    <p className="text-warning/80 mb-3">
                      ⏳ Expires: {new Date(item.expires_at).toLocaleString()}
                    </p>
                  )}
                  {item.pickup_deadline && (
                    <p className="text-warning/80 mb-3">
                      🕐 Pickup by: {new Date(item.pickup_deadline).toLocaleString()}
                    </p>
                  )}
                  <p
                    className={`mt-3 font-medium ${getStatusColor(item.status)}`}
                  >
                    Status: {getStatusLabel(item.status)}
                  </p>

                  {item.status === "AVAILABLE" && (
                    <button
                      onClick={() => handleClaim(item.id)}
                      disabled={updating === item.id}
                      className="mt-4 w-full px-6 py-3 btn-primary rounded-xl font-medium transition-all disabled:bg-brand-subtle disabled:pointer-events-none"
                    >
                      {updating === item.id ? "Claiming..." : "Claim This Donation"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-[color-surface] px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-brand-primary mb-8">
            Your Impact 💪
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto">
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <p className="text-3xl font-bold text-status-completed">
                {stats?.totalPickups || 0}
              </p>
              <p className="text-muted-foreground/80 mt-1">Completed Pickups</p>
            </div>
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <p className="text-3xl font-bold text-brand-primary">
                {stats?.totalQuantity || 0}
              </p>
              <p className="text-muted-foreground/80 mt-1">Total Quantity Delivered</p>
            </div>
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <p className="text-3xl font-bold text-foreground">
                {stats?.activeAssignment ? "Active" : "Available"}
              </p>
              <p className="text-muted-foreground/80 mt-1">Current Status</p>
            </div>
            <div className="card p-6 text-center hover:shadow-lg transition-shadow">
              <p className="text-3xl font-bold text-warning/80">
                {stats?.activeAssignment?.donationId
                  ? stats.activeAssignment.donationId.slice(0, 8) + "..."
                  : "—"}
              </p>
              <p className="text-muted-foreground/80 mt-1">Current Assignment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Assignment */}
      {stats?.activeAssignment && (
        <section className="py-10 px-6">
          <div className="max-w-md mx-auto card p-8">
            <h2 className="text-2xl font-semibold text-brand-primary mb-4">
              Active Assignment 📋
            </h2>

            <p className="text-muted-foreground mb-2">
              <strong>Donation ID:</strong> {stats.activeAssignment.donationId.slice(0, 8)}...
            </p>
            <p className="text-muted-foreground mb-2">
              <strong>Picked Up:</strong> {" "}{stats.activeAssignment.pickedUp ? (
                <span className="text-status-completed">Yes ✅</span>
              ) : (
                <span className="text-status-assigned">No</span>
              )}
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Delivered:</strong> {" "}{stats.activeAssignment.delivered ? (
                <span className="text-status-completed">Yes ✅</span>
              ) : (
                <span className="text-status-assigned">No</span>
              )}
            </p>

            <Link href="/volunteer/tasks">
              <button className="btn-primary w-full px-6 py-3 rounded-xl font-medium transition-all">
                View Task Details
              </button>
            </Link>
          </div>
        </section>
      )}

      {/* My Tasks Link */}
      <section className="py-10 px-6 text-center">
        <Link href="/volunteer/tasks">
          <button className="btn-primary px-6 py-3 rounded-xl font-medium transition-all hover:scale-105">
            View My Tasks
          </button>
        </Link>
      </section>
    </main>
  );
}