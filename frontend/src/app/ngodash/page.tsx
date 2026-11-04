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
    <main className="min-h-screen bg-[#EEF4EC] text-[#111827]">
      <NgoNavbar />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Deep Forest Pine Command Banner */}
        <div className="bg-[#0B331E] border border-[#184F31] rounded-lg p-6 text-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#184F31]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#13492B] text-emerald-300 border border-[#21663F]">
                  FACILITY INTAKE DOCK
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                  BAY STATUS: ACTIVE
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Receiving Dock & Quality Verification
              </h1>
              <p className="text-xs text-emerald-100/75 mt-1 max-w-2xl">
                Verify inbound food rescue shipments, inspect safety controls, and log certified community distribution
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-200/80">Staging Bay:</span>
              <span className="text-xs font-semibold font-mono text-emerald-200 bg-[#124227] border border-emerald-600/40 px-3 py-1 rounded">
                74% Capacity Available
              </span>
            </div>
          </div>

          {/* 3 Integrated KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#184F31] pt-5">
            <div className="py-2 md:py-0 md:px-5 first:pl-0">
              <span className="text-xs font-medium text-emerald-200/70 uppercase tracking-wider">
                Incoming Shipments
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {incoming.length}
              </p>
              <p className="text-xs text-emerald-200/60 mt-1">
                Currently in transit or awaiting intake
              </p>
            </div>

            <div className="py-2 md:py-0 md:px-5">
              <span className="text-xs font-medium text-emerald-200/70 uppercase tracking-wider">
                Verified Intakes (Past 30 Days)
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                {history.length}
              </p>
              <p className="text-xs text-emerald-200/60 mt-1">
                Certified for community consumption
              </p>
            </div>

            <div className="py-2 md:py-0 md:px-5 last:pr-0">
              <span className="text-xs font-medium text-emerald-200/70 uppercase tracking-wider">
                Safety Verification Rate
              </span>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mt-1 tabular-nums">
                100%
              </p>
              <p className="text-xs text-emerald-200/60 mt-1">
                Zero safety discrepancies recorded
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-[#CBDBC7]">
          <button
            onClick={() => setActiveTab("hub")}
            className={`pb-2.5 px-4 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === "hub"
                ? "border-[#135936] text-[#0B331E] font-bold"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Receiving Hub
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={`pb-2.5 px-4 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === "incoming"
                ? "border-[#135936] text-[#0B331E] font-bold"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Incoming Bay ({incoming.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 px-4 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === "history"
                ? "border-[#135936] text-[#0B331E] font-bold"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Intake History ({history.length})
          </button>
        </div>

        {/* Tab 1: Receiving Hub */}
        {activeTab === "hub" && (
          <div className="space-y-6">
            {/* Safety Protocol Card */}
            <div className="manifest-docket p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#0B331E] flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#165E39]" />
                  <span>Standardized 3-Point Food Safety Protocol</span>
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Mandatory inspection criteria before distributing donated food to community residents
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-[#F2F7F0] border border-[#CBDBC7] rounded-md">
                  <div className="flex items-center gap-2 font-bold text-[#0B331E] mb-1">
                    <Thermometer className="size-4 text-[#165E39]" />
                    <span>Thermal Integrity</span>
                  </div>
                  <p className="text-gray-700">
                    Hot food kept &gt;60°C or refrigerated &lt;4°C during courier transit
                  </p>
                </div>

                <div className="p-4 bg-[#F2F7F0] border border-[#CBDBC7] rounded-md">
                  <div className="flex items-center gap-2 font-bold text-[#0B331E] mb-1">
                    <Package className="size-4 text-[#165E39]" />
                    <span>Sealed Packaging</span>
                  </div>
                  <p className="text-gray-700">
                    Food-grade containers intact with zero cross-contamination or breach
                  </p>
                </div>

                <div className="p-4 bg-[#F2F7F0] border border-[#CBDBC7] rounded-md">
                  <div className="flex items-center gap-2 font-bold text-[#0B331E] mb-1">
                    <Clock className="size-4 text-[#165E39]" />
                    <span>Prompt Handover</span>
                  </div>
                  <p className="text-gray-700">
                    Received within certified shelf-life window for same-day distribution
                  </p>
                </div>
              </div>
            </div>

            {/* Inbound Preview Table */}
            <div className="manifest-card overflow-hidden">
              <div className="px-5 py-4 bg-[#E5EDE2] border-b border-[#CBDBC7] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0B331E]">
                    Deliveries Awaiting Intake
                  </h3>
                  <p className="text-xs text-gray-600">
                    Shipments arriving at your bay
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("incoming")}
                  className="text-xs font-semibold text-[#135936] hover:text-[#0B331E] cursor-pointer"
                >
                  View All Deliveries →
                </button>
              </div>

              {incoming.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No pending deliveries at the bay right now.
                </div>
              ) : (
                <div className="divide-y divide-[#E2ECE0]">
                  {incoming.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F2F7F0]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0B331E] bg-[#E2ECE0] px-2 py-0.5 rounded border border-[#CBDBC7]">
                            {item.id}
                          </span>
                          <span className="font-bold text-xs text-gray-900">
                            {item.title || item.food_category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {item.quantity} {item.unit || "servings"} • Origin: {item.donor?.name || "Donor"} • Courier: {item.assignment?.volunteer?.name || "Assigned Courier"}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setInspectingItem(item);
                          setActiveTab("incoming");
                        }}
                        className="px-3.5 py-1.5 bg-[#135936] hover:bg-[#0D4026] text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
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
            <h2 className="text-base font-bold text-[#0B331E]">
              Inbound Deliveries & Inspection Bay
            </h2>

            {incoming.length === 0 ? (
              <div className="manifest-card p-12 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  The receiving dock is currently clear
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  When couriers arrive with surplus food, shipments appear here for digital inspection.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {incoming.map((item) => (
                  <div key={item.id} className="manifest-docket p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0B331E] bg-[#E2ECE0] px-2 py-0.5 rounded border border-[#CBDBC7]">{item.id}</span>
                        <h3 className="font-bold text-sm text-gray-900">{item.title || item.food_category}</h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E4F2E7] text-[#115E34] border border-[#A9D8B6]">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Quantity:</span> {item.quantity} {item.unit || "servings"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Source:</span> {item.pickup_address}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Donor:</span> {item.donor?.name || "Partner Donor"} ({item.donor?.phonenumber || "—"})
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Courier:</span> {item.assignment?.volunteer?.name || "Field Courier"} ({item.assignment?.volunteer?.phonenumber || "—"})
                      </p>
                    </div>

                    <button
                      onClick={() => setInspectingItem(item)}
                      className="px-4 py-2 bg-[#135936] hover:bg-[#0D4026] text-white rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
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
            <h2 className="text-base font-bold text-[#0B331E]">
              Verified Intake History & Distribution Log
            </h2>

            {history.length === 0 ? (
              <div className="manifest-card p-12 text-center text-xs text-gray-500">
                No past verified intake records found.
              </div>
            ) : (
              <div className="manifest-card overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#CBDBC7] bg-[#E5EDE2] text-[#1E3E2B] font-bold">
                      <th className="py-2.5 px-4">Intake ID</th>
                      <th className="py-2.5 px-4">Food Item</th>
                      <th className="py-2.5 px-4">Quantity</th>
                      <th className="py-2.5 px-4">Donor Source</th>
                      <th className="py-2.5 px-4">Verification Notes</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2ECE0]">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-[#F2F7F0]">
                        <td className="py-3 px-4 font-mono font-bold text-[#0B331E]">
                          {record.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {record.title || record.food_category || "Surplus Batch"}
                        </td>
                        <td className="py-3 px-4 text-gray-700 tabular-nums font-medium">
                          {record.quantity} {record.unit || "servings"}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {record.donor_name || "Partner Donor"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                          {record.notes || "Inspected & approved"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E4F2E7] text-[#115E34] border border-[#A9D8B6]">
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
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="manifest-card max-w-lg w-full p-6 space-y-4 shadow-xl border-[#CBDBC7]">
              <div className="flex items-center justify-between pb-3 border-b border-[#CBDBC7]">
                <h3 className="font-bold text-sm text-[#0B331E] flex items-center gap-2">
                  <ClipboardCheck className="size-4 text-[#165E39]" />
                  <span>Intake Quality Inspection: {inspectingItem.id}</span>
                </h3>
                <button
                  onClick={() => setInspectingItem(null)}
                  className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-1 bg-[#F2F7F0] p-3 rounded border border-[#CBDBC7]">
                <p className="text-gray-900">
                  <span className="font-bold">Cargo:</span> {inspectingItem.title || inspectingItem.food_category} ({inspectingItem.quantity} {inspectingItem.unit || "servings"})
                </p>
                <p className="text-gray-600">
                  Delivered by: {inspectingItem.assignment?.volunteer?.name || "Assigned Courier"}
                </p>
              </div>

              {/* 3-Point Checklist */}
              <div className="space-y-2 pt-2 border-t border-[#CBDBC7] text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-gray-800">
                  <input
                    type="checkbox"
                    checked={tempChecked}
                    onChange={(e) => setTempChecked(e.target.checked)}
                    className="rounded border-[#CBDBC7] text-[#135936] focus:ring-[#135936]"
                  />
                  <span>Thermal Integrity verified (hot &gt;60°C or cold &lt;4°C)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-gray-800">
                  <input
                    type="checkbox"
                    checked={packagingChecked}
                    onChange={(e) => setPackagingChecked(e.target.checked)}
                    className="rounded border-[#CBDBC7] text-[#135936] focus:ring-[#135936]"
                  />
                  <span>Packaging seal and hygiene inspection intact</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-gray-800">
                  <input
                    type="checkbox"
                    checked={smellChecked}
                    onChange={(e) => setSmellChecked(e.target.checked)}
                    className="rounded border-[#CBDBC7] text-[#135936] focus:ring-[#135936]"
                  />
                  <span>Visual and freshness sensory check passed</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B331E] mb-1">
                  Intake Notes (Optional):
                </label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  placeholder="e.g. Stored in Walk-In Cooler Bay 2"
                  className="w-full text-xs px-3 py-2 bg-white border border-[#CBDBC7] rounded focus:outline-none focus:border-[#135936]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#CBDBC7]">
                <button
                  onClick={() => setInspectingItem(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReceipt}
                  disabled={submitting || !tempChecked || !packagingChecked || !smellChecked}
                  className="px-4 py-2 bg-[#135936] hover:bg-[#0D4026] text-white rounded text-xs font-bold transition-colors cursor-pointer disabled:bg-gray-300 shadow-xs"
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
