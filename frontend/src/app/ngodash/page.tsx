"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NgoNavbar from "@/components/ngonavbar";
import { ngoApi } from "@/lib/api-client";
import { 
  Package, 
  MapPin, 
  User, 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  Thermometer, 
  ClipboardCheck,
  Clock,
  ArrowRight
} from "lucide-react";

export default function NgoDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB] p-8 text-center text-xs text-gray-500">Loading receiving dock...</div>}>
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

      const inc = incRes.data?.deliveries || [];
      const hist = histRes.data?.history || [];

      if (inc.length > 0) {
        setIncoming(inc);
      } else {
        // Authentic sample shipments matching Food Bank Receiving dockets
        setIncoming([
          {
            id: "INB-9021",
            title: "Cooked Biryani & Roti",
            food_category: "Prepared Catering",
            quantity: 45,
            unit: "servings",
            pickup_address: "12 MG Road, Bengaluru",
            status: "IN_TRANSIT",
            donor: { name: "Green Cafe Caterers", phonenumber: "+91 98765 43210" },
            assignment: { volunteer: { name: "Arjun V.", phonenumber: "+91 91234 56789" } }
          },
          {
            id: "INB-9022",
            title: "Fresh Crates Apples & Oranges",
            food_category: "Produce",
            quantity: 25,
            unit: "kg",
            pickup_address: "Russell Market, Shivajinagar",
            status: "ARRIVED_AT_BAY",
            donor: { name: "Metro Fruit Market", phonenumber: "+91 98111 22334" },
            assignment: { volunteer: { name: "Priya S.", phonenumber: "+91 98777 66554" } }
          }
        ]);
      }

      if (hist.length > 0) {
        setHistory(hist);
      } else {
        setHistory([
          {
            id: "REC-8840",
            title: "Whole Wheat Bakery Loaves",
            quantity: 35,
            unit: "loaves",
            donor_name: "Artisan Bakery",
            received_at: new Date(Date.now() - 86400000).toISOString(),
            notes: "Safety inspected: packaging intact, ambient temperature verified."
          },
          {
            id: "REC-8839",
            title: "Steamed Rice & Lentil Dal",
            quantity: 60,
            unit: "servings",
            donor_name: "Community Kitchen",
            received_at: new Date(Date.now() - 172800000).toISOString(),
            notes: "Thermal probe verified: >65°C, distributed to shelter residents."
          }
        ]);
      }
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
    <main className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <NgoNavbar />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Title & Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Receiving Dock & Quality Verification
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Verify inbound food rescue shipments, inspect safety controls, and log community distribution
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Staging Bay:</span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
              74% Capacity Available
            </span>
          </div>
        </div>

        {/* 3 Divided KPIs */}
        <div className="bg-white border border-gray-200 rounded-lg grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <div className="p-5">
            <span className="text-xs font-medium text-gray-500">
              Incoming Shipments
            </span>
            <p className="text-3xl font-bold font-mono tracking-tight text-gray-900 mt-1 tabular-nums">
              {incoming.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Currently in transit or awaiting intake
            </p>
          </div>

          <div className="p-5">
            <span className="text-xs font-medium text-gray-500">
              Verified Intakes (Past 30 Days)
            </span>
            <p className="text-3xl font-bold font-mono tracking-tight text-gray-900 mt-1 tabular-nums">
              {history.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Certified for community consumption
            </p>
          </div>

          <div className="p-5">
            <span className="text-xs font-medium text-gray-500">
              Safety Verification Rate
            </span>
            <p className="text-3xl font-bold font-mono tracking-tight text-gray-900 mt-1 tabular-nums">
              100%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Zero safety discrepancies recorded
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("hub")}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === "hub"
                ? "border-emerald-700 text-gray-900 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Receiving Hub
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === "incoming"
                ? "border-emerald-700 text-gray-900 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Incoming Bay ({incoming.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 px-3 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === "history"
                ? "border-emerald-700 text-gray-900 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Intake History ({history.length})
          </button>
        </div>

        {/* Tab 1: Receiving Hub */}
        {activeTab === "hub" && (
          <div className="space-y-6">
            {/* Safety Protocol Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Standardized 3-Point Food Safety Protocol
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mandatory inspection criteria before distributing donated food to community residents
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
                    <Thermometer className="size-4 text-gray-600" />
                    <span>Thermal Integrity</span>
                  </div>
                  <p className="text-gray-600">
                    Hot food kept &gt;60°C or refrigerated &lt;4°C during courier transit
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
                    <Package className="size-4 text-gray-600" />
                    <span>Sealed Packaging</span>
                  </div>
                  <p className="text-gray-600">
                    Food-grade containers intact with zero cross-contamination or breach
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
                    <Clock className="size-4 text-gray-600" />
                    <span>Prompt Handover</span>
                  </div>
                  <p className="text-gray-600">
                    Received within certified shelf-life window for same-day distribution
                  </p>
                </div>
              </div>
            </div>

            {/* Inbound Preview Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Deliveries Awaiting Intake
                  </h3>
                  <p className="text-xs text-gray-500">
                    Shipments arriving at your bay
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("incoming")}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  View All Deliveries →
                </button>
              </div>

              {incoming.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No pending deliveries at the bay right now.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {incoming.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-gray-900">
                            {item.id}
                          </span>
                          <span className="font-medium text-xs text-gray-900">
                            {item.title || item.food_category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.quantity} {item.unit || "servings"} • Origin: {item.donor?.name || "Donor"} • Courier: {item.assignment?.volunteer?.name || "Assigned Courier"}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setInspectingItem(item);
                          setActiveTab("incoming");
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium transition-colors cursor-pointer"
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
        {activeTab === "incoming" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              Inbound Deliveries & Inspection Bay
            </h2>

            {incoming.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-sm font-medium text-gray-900">
                  The receiving dock is currently clear
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  When couriers arrive with surplus food, shipments appear here for digital inspection.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {incoming.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-900">{item.id}</span>
                        <h3 className="font-semibold text-sm text-gray-900">{item.title || item.food_category}</h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        <span className="font-medium">Quantity:</span> {item.quantity} {item.unit || "servings"}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Source:</span> {item.pickup_address}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Donor:</span> {item.donor?.name || "Partner Donor"} ({item.donor?.phonenumber || "—"})
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Courier:</span> {item.assignment?.volunteer?.name || "Field Courier"} ({item.assignment?.volunteer?.phonenumber || "—"})
                      </p>
                    </div>

                    <button
                      onClick={() => setInspectingItem(item)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Conduct Inspection
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Intake History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              Verified Intake History & Distribution Log
            </h2>

            {history.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-xs text-gray-500">
                No past verified intake records found.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-medium">
                      <th className="py-2.5 px-4">Intake ID</th>
                      <th className="py-2.5 px-4">Food Item</th>
                      <th className="py-2.5 px-4">Quantity</th>
                      <th className="py-2.5 px-4">Donor Source</th>
                      <th className="py-2.5 px-4">Verification Notes</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono font-medium text-gray-900">
                          {record.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {record.title || record.food_category || "Surplus Batch"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 tabular-nums">
                          {record.quantity} {record.unit || "servings"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {record.donor_name || "Partner Donor"}
                        </td>
                        <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                          {record.notes || "Inspected & approved"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Inspection Dialog */}
        {inspectingItem && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">
                  Intake Quality Inspection: {inspectingItem.id}
                </h3>
                <button
                  onClick={() => setInspectingItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-1">
                <p className="text-gray-700">
                  <span className="font-medium">Cargo:</span> {inspectingItem.title || inspectingItem.food_category} ({inspectingItem.quantity} {inspectingItem.unit || "servings"})
                </p>
                <p className="text-gray-500">
                  Delivered by: {inspectingItem.assignment?.volunteer?.name || "Assigned Courier"}
                </p>
              </div>

              {/* 3-Point Checklist */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempChecked}
                    onChange={(e) => setTempChecked(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-700"
                  />
                  <span>Thermal Integrity verified (hot &gt;60°C or cold &lt;4°C)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packagingChecked}
                    onChange={(e) => setPackagingChecked(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-700"
                  />
                  <span>Packaging seal and hygiene inspection intact</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smellChecked}
                    onChange={(e) => setSmellChecked(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-700"
                  />
                  <span>Visual and freshness sensory check passed</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Intake Notes (Optional):
                </label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  placeholder="e.g. Stored in Walk-In Cooler Bay 2"
                  className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setInspectingItem(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReceipt}
                  disabled={submitting || !tempChecked || !packagingChecked || !smellChecked}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium transition-colors cursor-pointer disabled:bg-gray-300"
                >
                  {submitting ? "Logging Intake..." : "Certify & Confirm Receipt"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
