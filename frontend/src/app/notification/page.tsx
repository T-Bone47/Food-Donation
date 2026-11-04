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
    <main className="min-h-screen bg-[#EEF4EC] text-[#111827]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Deep Forest Pine Command Banner */}
        <div className="bg-[#0B331E] border border-[#184F31] rounded-lg p-6 text-white shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#13492B] text-emerald-300 border border-[#21663F]">
              SYSTEM FEED
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
              SOCKET STATUS: LIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Activity & System Alerts
          </h1>
          <p className="text-xs text-emerald-100/75 mt-1">
            Realtime updates on courier assignments, custody progress, and verified delivery confirmations
          </p>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="space-y-2">
              <div className="manifest-card h-16 p-4 animate-pulse" />
              <div className="manifest-card h-16 p-4 animate-pulse" />
            </div>
          )}

          {!loading && notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className="manifest-docket p-4 flex justify-between items-center transition-all hover:border-[#A2BFA0]"
              >
                <div className="flex items-start gap-3.5 pr-4">
                  <div className="p-2.5 bg-[#E2ECE0] border border-[#CBDBC7] rounded-md text-[#165E39] mt-0.5 shrink-0">
                    <Bell className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-mono">
                      <Clock className="size-3 text-[#165E39]" />
                      <span>{n.time}</span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(n.id)}
                  className="text-gray-500 hover:text-gray-900 hover:bg-[#E2ECE0] rounded text-xs cursor-pointer font-medium"
                >
                  Dismiss
                </Button>
              </div>
            ))
          ) : (
            !loading && (
              <div className="text-center manifest-card p-12">
                <CheckCircle2 className="size-8 text-[#165E39] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#0B331E]">All Caught Up</p>
                <p className="text-xs text-gray-600 mt-1">No pending activity alerts right now.</p>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
