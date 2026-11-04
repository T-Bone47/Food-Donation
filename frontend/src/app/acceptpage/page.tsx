"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/volunavbar";
import { volunteerApi, donationsApi } from "@/lib/api-client";

export default function ServicePage() {
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchActiveTask = async () => {
    try {
      setLoading(true);
      const res = await volunteerApi.getTasks({ status: "ASSIGNED" });
      const tasks = res.data?.tasks || [];
      if (tasks.length > 0) {
        setActiveTask(tasks[0]);
      } else {
        // Try picked up tasks
        const pickedRes = await volunteerApi.getTasks({ status: "PICKED_UP" });
        const picked = pickedRes.data?.tasks || [];
        if (picked.length > 0) {
          setActiveTask(picked[0]);
        } else {
          setActiveTask(null);
        }
      }
    } catch (err) {
      console.error("Error fetching active volunteer task:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTask();
  }, []);

  const handlePicked = async () => {
    if (!activeTask) return;
    setActionLoading(true);
    try {
      await volunteerApi.confirmPickup(activeTask.id);
      alert("Pickup confirmed! Cargo is now in transit.");
      fetchActiveTask();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Error confirming pickup");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelivered = async () => {
    if (!activeTask) return;
    setActionLoading(true);
    try {
      await volunteerApi.confirmDelivery(activeTask.id);
      alert("Delivery confirmed! Notified receiving NGO for quality inspection.");
      fetchActiveTask();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Error confirming delivery");
    } finally {
      setActionLoading(false);
    }
  };

  const status =
    activeTask?.status === "PICKED_UP"
      ? "Picked"
      : activeTask?.status === "DELIVERED" || activeTask?.status === "COMPLETED"
      ? "Delivered"
      : "Accepted";

  const donation = activeTask
    ? {
        id: activeTask.id,
        food: activeTask.title || activeTask.food_category || "Fresh Cooked Meals",
        location: activeTask.pickup_address || `${activeTask.area || "Bengaluru"}, ${activeTask.state || "Karnataka"}`,
        donor: activeTask.donor?.name || "Green Cafe Caterers",
        donorPhone: activeTask.donor?.phonenumber || "+91 98765 43210",
        donorEmail: activeTask.donor?.email || "contact@greencafe.com",
        bestBefore: activeTask.expires_at ? new Date(activeTask.expires_at).toLocaleTimeString() : "Within 2 hours",
        type: activeTask.food_category || "Cooked Meals",
        servings: activeTask.quantity ? `${activeTask.quantity} ${activeTask.unit || "servings"}` : "25 servings",
      }
    : {
        id: "D-DEMO-101",
        food: "Vegetable Biryani",
        location: "MG Road, Bengaluru",
        donor: "Green Cafe Caterers",
        donorPhone: "+91 98765 43210",
        donorEmail: "contact@greencafe.com",
        bestBefore: "2 hours",
        type: "Main Course",
        servings: "25 servings",
      };

  return (
    <main className="min-h-screen bg-green-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Pickup Tracking 🚴‍♂️
        </h1>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading mission dispatch details...</p>
        ) : (
          <>
            {/* Donation Info Card */}
            <div className="bg-white shadow-md p-6 rounded-xl mb-6 space-y-2 border border-green-100">
              <h2 className="text-2xl font-bold text-green-700">{donation.food}</h2>
              <p className="text-gray-700">📍 <strong>Location:</strong> {donation.location}</p>
              <p className="text-gray-700">👤 <strong>Donor:</strong> {donation.donor}</p>
              <p className="text-gray-700">📞 <strong>Phone:</strong> {donation.donorPhone}</p>
              <p className="text-gray-700">📧 <strong>Email:</strong> {donation.donorEmail}</p>
              <p className="text-gray-700">🍴 <strong>Type:</strong> {donation.type}</p>
              <p className="text-gray-700">🥘 <strong>Servings:</strong> {donation.servings}</p>
              <p className="text-gray-700">⏰ <strong>Best Before:</strong> {donation.bestBefore}</p>
            </div>

            {/* Status Section */}
            <div className="bg-green-100 p-6 rounded-xl mb-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                Order Status
              </h3>
              <div className="flex gap-3 mb-4">
                <div
                  className={`flex-1 p-3 rounded-lg text-center font-semibold text-sm transition ${
                    status === "Accepted"
                      ? "bg-green-600 text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  Accepted
                </div>
                <div
                  className={`flex-1 p-3 rounded-lg text-center font-semibold text-sm transition ${
                    status === "Picked"
                      ? "bg-green-600 text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  Picked
                </div>
                <div
                  className={`flex-1 p-3 rounded-lg text-center font-semibold text-sm transition ${
                    status === "Delivered"
                      ? "bg-green-600 text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  Delivered
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {status === "Accepted" && (
                  <button
                    onClick={handlePicked}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition font-semibold cursor-pointer shadow-md disabled:bg-gray-400"
                  >
                    {actionLoading ? "Updating..." : "Confirm Cargo Handover: Picked ✅"}
                  </button>
                )}
                {status === "Picked" && (
                  <button
                    onClick={handleDelivered}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition font-semibold cursor-pointer shadow-md disabled:bg-gray-400"
                  >
                    {actionLoading ? "Updating..." : "Confirm NGO Dock Handover: Delivered 🏁"}
                  </button>
                )}
                {status === "Delivered" && (
                  <div className="w-full text-center py-2 text-green-800 font-semibold text-sm">
                    ✓ Mission completed! Delivery registered with the community hub.
                  </div>
                )}
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-green-100 text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-3 text-left">
                Live Location Map 🗺️
              </h3>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9856515405814!2d77.5945627!3d12.9715987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru!5e0!3m2!1sen!2sin!4v1694800000000!5m2!1sen!2sin"
                width="100%"
                height="280"
                allowFullScreen
                loading="lazy"
                className="w-full rounded-lg shadow-xs border border-gray-200"
              ></iframe>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
