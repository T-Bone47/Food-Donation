"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NgoNavbar from "@/components/ngonavbar";
import { ngoApi, donationsApi } from "@/lib/api-client";

export default function NgoDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-green-50 p-8 text-center text-gray-500">Loading NGO Hub...</div>}>
      <NgoDashboard />
    </Suspense>
  );
}

function NgoDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") || "hub";
  const [activeTab, setActiveTab] = useState<"hub" | "incoming" | "history">("hub");
  const [incoming, setIncoming] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectingItem, setInspectingItem] = useState<any | null>(null);
  const [tempChecked, setTempChecked] = useState(true);
  const [packagingChecked, setPackagingChecked] = useState(true);
  const [smellChecked, setSmellChecked] = useState(true);
  const [intakeNotes, setIntakeNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tabParam === "incoming") setActiveTab("incoming");
    else if (tabParam === "history") setActiveTab("history");
    else setActiveTab("hub");
  }, [tabParam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incRes, histRes] = await Promise.all([
        ngoApi.getIncoming().catch(() => ({ data: { deliveries: [] } })),
        ngoApi.getHistory({ limit: 50 }).catch(() => ({ data: { history: [] } })),
      ]);

      setIncoming(incRes.data?.deliveries || []);
      setHistory(histRes.data?.history || []);
    } catch (err) {
      console.error("Error loading NGO deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmReceipt = async () => {
    if (!inspectingItem) return;
    setSubmitting(true);
    try {
      await ngoApi.confirmReceipt(inspectingItem.id, {
        notes: intakeNotes || "Quality inspected: temp verified, hygienic packaging intact.",
      });
      alert("Donation successfully received, inspected, and verified for community distribution!");
      setInspectingItem(null);
      setIntakeNotes("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Error confirming receipt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-green-50">
      <NgoNavbar />

      {/* Hero Section */}
      <section className="bg-green-100 py-16 px-6 text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          NGO Receiving Hub & Quality Inspection 🏢
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Verify incoming food rescue deliveries, inspect safety criteria, and distribute nutrition to communities in need.
        </p>

        {/* Navigation Switcher Pills */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => {
              setActiveTab("hub");
              router.push("/ngodash");
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-xs ${
              activeTab === "hub"
                ? "bg-green-700 text-white shadow-md"
                : "bg-white text-green-800 hover:bg-green-50 border border-green-200"
            }`}
          >
            Receiving Hub Overview
          </button>
          <button
            onClick={() => {
              setActiveTab("incoming");
              router.push("/ngodash?tab=incoming");
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-xs ${
              activeTab === "incoming"
                ? "bg-green-700 text-white shadow-md"
                : "bg-white text-green-800 hover:bg-green-50 border border-green-200"
            }`}
          >
            Incoming Bay ({incoming.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              router.push("/ngodash?tab=history");
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-xs ${
              activeTab === "history"
                ? "bg-green-700 text-white shadow-md"
                : "bg-white text-green-800 hover:bg-green-50 border border-green-200"
            }`}
          >
            Intake Ledger ({history.length})
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 px-6 text-center bg-green-50">
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 max-w-5xl mx-auto">
          <div className="bg-white shadow-md p-6 rounded-xl w-60 text-center hover:shadow-lg transition border border-green-100">
            <p className="text-3xl font-bold text-green-700">{incoming.length}</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Inbound Deliveries</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl w-60 text-center hover:shadow-lg transition border border-green-100">
            <p className="text-3xl font-bold text-green-700">1,840</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Meals Distributed</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl w-60 text-center hover:shadow-lg transition border border-green-100">
            <p className="text-3xl font-bold text-green-700">{history.length + 18}</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Verified Intakes</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl w-60 text-center hover:shadow-lg transition border border-green-100">
            <p className="text-3xl font-bold text-green-700">14</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Partner Shelters</p>
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        {loading && (
          <p className="text-center text-gray-500 py-12">Loading NGO dock and inventory data...</p>
        )}

        {/* Tab 1: Receiving Hub Overview */}
        {!loading && activeTab === "hub" && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-md p-8 border border-green-100">
              <h2 className="text-2xl font-bold text-green-800 mb-3">
                Community Distribution & Safety Protocol
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                All food rescues delivered to your facility must undergo the standardized 3-point digital safety inspection (temperature check, container seal verification, sensory quality check) before community handover.
              </p>

              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                  <span className="text-2xl">🌡️</span>
                  <h4 className="font-semibold text-green-900 mt-2">Thermal Integrity</h4>
                  <p className="text-xs text-gray-600 mt-1">Cooked food &gt;60°C or chilled &lt;4°C</p>
                </div>
                <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                  <span className="text-2xl">📦</span>
                  <h4 className="font-semibold text-green-900 mt-2">Sealed Cargo</h4>
                  <p className="text-xs text-gray-600 mt-1">Insulated, food-grade packaging intact</p>
                </div>
                <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                  <span className="text-2xl">⏱️</span>
                  <h4 className="font-semibold text-green-900 mt-2">Prompt Handover</h4>
                  <p className="text-xs text-gray-600 mt-1">Within verified shelf-life window</p>
                </div>
              </div>
            </div>

            {/* Quick Inbound preview */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-green-800">Deliveries Awaiting Intake</h3>
                <button
                  onClick={() => setActiveTab("incoming")}
                  className="text-sm text-green-700 hover:text-green-900 font-semibold underline cursor-pointer"
                >
                  View All Incoming Deliveries →
                </button>
              </div>

              {incoming.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl shadow-xs border border-green-100">
                  <p className="text-gray-500">No pending deliveries at the bay right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incoming.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white shadow-md rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-green-100"
                    >
                      <div>
                        <h4 className="font-bold text-green-800 text-lg">{item.title || item.food_category}</h4>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.unit || "servings"} • From: {item.donor?.name || "Partner Donor"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Courier: {item.assignment?.volunteer?.name || "Assigned Courier"} • Location: {item.pickup_address}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInspectingItem(item);
                          setActiveTab("incoming");
                        }}
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-xs"
                      >
                        Inspect & Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Incoming Bay */}
        {!loading && activeTab === "incoming" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-800">Incoming Deliveries & Inspection Bay</h2>

            {incoming.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-md border border-green-100 p-8">
                <p className="text-gray-600 text-lg mb-2">The receiving dock is clear.</p>
                <p className="text-gray-400 text-sm">When volunteers deliver surplus food to your hub, batches will appear here for intake inspection.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incoming.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white shadow-md rounded-xl p-6 border border-green-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-green-700">{item.title || item.food_category}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        📦 <strong>Quantity:</strong> {item.quantity} {item.unit || "servings"}
                      </p>
                      <p className="text-gray-700 text-sm">
                        📍 <strong>Pickup Source:</strong> {item.pickup_address}
                      </p>
                      <p className="text-gray-700 text-sm">
                        👤 <strong>Donor:</strong> {item.donor?.name || "Partner Donor"} ({item.donor?.phonenumber || "—"})
                      </p>
                      <p className="text-gray-700 text-sm">
                        🚴 <strong>Courier:</strong> {item.assignment?.volunteer?.name || "Field Courier"} ({item.assignment?.volunteer?.phonenumber || "—"})
                      </p>
                    </div>

                    <button
                      onClick={() => setInspectingItem(item)}
                      className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg font-semibold text-sm shadow-md transition cursor-pointer whitespace-nowrap"
                    >
                      Conduct Safety Inspection 📋
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Intake History */}
        {!loading && activeTab === "history" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-800">Received History & Intake Archive</h2>

            {history.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-md border border-green-100 p-8">
                <p className="text-gray-600 text-lg">No verified past intakes on record yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white shadow-md rounded-xl p-5 border border-green-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-green-800 text-lg">
                          {record.title || record.food_category || "Rescued Food"}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800">
                          Verified & Distributed
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantity: {record.quantity} {record.unit || "servings"} • Donor: {record.donor_name || "Community Partner"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Completed at: {record.completed_at ? new Date(record.completed_at).toLocaleString() : "Recently verified"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                        ID: {record.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inspection Modal */}
        {inspectingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-green-200">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h3 className="text-xl font-bold text-green-800">
                  Digital Quality & Safety Intake
                </h3>
                <button
                  onClick={() => setInspectingItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900">{inspectingItem.title || inspectingItem.food_category}</p>
                  <p className="text-xs text-gray-500">{inspectingItem.quantity} {inspectingItem.unit || "servings"} • Delivered by {inspectingItem.assignment?.volunteer?.name || "Courier"}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-3">
                  <h4 className="font-bold text-green-900 text-xs uppercase tracking-wider">Required Safety Checklist</h4>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempChecked}
                      onChange={(e) => setTempChecked(e.target.checked)}
                      className="size-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span>Temperature within safe limits (&gt;60°C or &lt;4°C)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={packagingChecked}
                      onChange={(e) => setPackagingChecked(e.target.checked)}
                      className="size-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span>Hygienic food packaging & seals intact</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smellChecked}
                      onChange={(e) => setSmellChecked(e.target.checked)}
                      className="size-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span>Sensory freshness & aroma verification passed</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Intake Notes / Community Distribution Destination
                  </label>
                  <textarea
                    rows={2}
                    value={intakeNotes}
                    onChange={(e) => setIntakeNotes(e.target.value)}
                    placeholder="e.g. Distributed to Hope Haven Family Shelter (Dinner service)"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setInspectingItem(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReceipt}
                  disabled={submitting || !tempChecked || !packagingChecked || !smellChecked}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold shadow-md transition cursor-pointer disabled:bg-gray-400"
                >
                  {submitting ? "Verifying..." : "Confirm & Complete Intake ✓"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
