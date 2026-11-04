"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/lib/api-client";
import { Bell, Clock, CheckCircle2 } from "lucide-react";

interface NotificationItem {
  id: string | number;
  message: string;
  time: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, message: "Your donation has been claimed by a verified volunteer courier.", time: "2 mins ago" },
    { id: 2, message: "Surplus batch successfully delivered to Community Shelter Hub.", time: "15 mins ago" },
    { id: 3, message: "New courier route dispatched in your service radius.", time: "1 hour ago" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);
        const res = await notificationsApi.getAll({ limit: 20 });
        const raw = res.data?.notifications || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped: NotificationItem[] = raw.map((n: any) => ({
            id: n.id,
            message: n.message || n.title || "Donation status update",
            time: n.created_at ? new Date(n.created_at).toLocaleTimeString() : "Just now",
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const handleDismiss = async (id: string | number) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    if (typeof id === "string") {
      try {
        await notificationsApi.markAsRead(id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Activity & System Alerts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Realtime updates on courier assignments, custody progress, and delivery confirmations
          </p>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="space-y-2">
              <div className="h-16 bg-white border border-gray-200 rounded-lg p-4" />
              <div className="h-16 bg-white border border-gray-200 rounded-lg p-4" />
            </div>
          )}

          {!loading && notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className="bg-white border border-gray-200 hover:border-gray-300 transition-colors rounded-lg p-4 flex justify-between items-center"
              >
                <div className="flex items-start gap-3 pr-4">
                  <div className="p-2 bg-gray-50 rounded text-gray-600 mt-0.5">
                    <Bell className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{n.time}</span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(n.id)}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded text-xs cursor-pointer"
                >
                  Dismiss
                </Button>
              </div>
            ))
          ) : (
            !loading && (
              <div className="text-center bg-white border border-gray-200 p-12 rounded-lg">
                <CheckCircle2 className="size-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">All Caught Up</p>
                <p className="text-xs text-gray-500 mt-1">No pending activity alerts right now.</p>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
