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
    <main className="min-h-screen bg-[#F9FAF8] text-[#1F2923]">
      <NgoNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-12 px-6 lg:px-12 border-b border-emerald-950/6 bg-gradient-to-b from-emerald-50/50 via-[#F9FAF8] to-[#F9FAF8]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 rounded-full text-xs font-semibold text-emerald-800 border border-emerald-200/60 mb-4 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Distribution Logistics Bay • Verified Community Partner
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            Receiving Dock & Quality Verification
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Inspect inbound cargo, certify temperature control and packaging safety, and log verified nutrition into community shelter distributions.
          </p>

          {/* Cold-Storage & Warehouse Bay Capacity Bar */}
          <div className="mt-8 max-w-xl mx-auto bg-white p-4 rounded-2xl border border-emerald-950/8 shadow-premium-xs text-left">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                <span>❄️ Cold-Chain & Staging Bay Capacity</span>
              </span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                74% Occupied
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "74%" }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              3 Chilled Bays Available • Ambient Shelves Ready for Inbound Cargo
            </p>
          </div>

          {/* Navigation Switcher Pills */}
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => {
                setActiveTab("hub");
                router.push("/ngodash");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
                activeTab === "hub"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-emerald-50/60 border border-emerald-950/8"
              }`}
            >
              Receiving Hub Overview
            </button>
            <button
              onClick={() => {
                setActiveTab("incoming");
                router.push("/ngodash?tab=incoming");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                activeTab === "incoming"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-emerald-50/60 border border-emerald-950/8"
              }`}
            >
              <span>Incoming Bay</span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px]">({incoming.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                router.push("/ngodash?tab=history");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
                activeTab === "history"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-emerald-50/60 border border-emerald-950/8"
              }`}
            >
              Intake Ledger ({history.length})
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-emerald-950/8 shadow-premium-xs text-left">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Inbound Shipments</span>
            <p className="text-3xl font-extrabold font-mono text-emerald-800 mt-1 tabular-nums">{incoming.length}</p>
            <span className="text-[11px] text-emerald-600 mt-1 inline-block">Active Courier Transits</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-emerald-950/8 shadow-premium-xs text-left">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Meals Distributed</span>
            <p className="text-3xl font-extrabold font-mono text-emerald-800 mt-1 tabular-nums">1,840</p>
            <span className="text-[11px] text-emerald-600 mt-1 inline-block">Total Verified Portions</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-emerald-950/8 shadow-premium-xs text-left">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Intake Audits Passed</span>
            <p className="text-3xl font-extrabold font-mono text-emerald-800 mt-1 tabular-nums">{history.length + 18}</p>
            <span className="text-[11px] text-emerald-600 mt-1 inline-block">100% Quality Rate</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-emerald-950/8 shadow-premium-xs text-left">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Partner Shelters</span>
            <p className="text-3xl font-extrabold font-mono text-emerald-800 mt-1 tabular-nums">14</p>
            <span className="text-[11px] text-emerald-600 mt-1 inline-block">Affiliated Distribution Hubs</span>
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        {loading && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-40 rounded-2xl bg-white border border-emerald-950/8 shadow-premium-xs animate-shimmer" />
            <div className="h-40 rounded-2xl bg-white border border-emerald-950/8 shadow-premium-xs animate-shimmer" />
          </div>
        )}

        {/* Tab 1: Receiving Hub Overview */}
        {!loading && activeTab === "hub" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-premium-xs p-8 border border-emerald-950/8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Standardized 3-Point Food Safety Protocol
              </h2>
              <p className="text-gray-600 text-xs leading-relaxed mb-6">
                All food rescues delivered to your facility must undergo the standardized 3-point digital safety inspection (temperature check, container seal verification, sensory quality check) before community handover.
              </p>

              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100">
                  <span className="text-2xl">🌡️</span>
                  <h4 className="font-bold text-emerald-950 text-sm mt-2">Thermal Integrity</h4>
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
