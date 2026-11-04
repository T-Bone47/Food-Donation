"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/lib/api-client";

interface NotificationItem {
  id: string | number;
  message: string;
  time: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, message: "Your donation is accepted by a volunteer.", time: "2 mins ago" },
    { id: 2, message: "Meal successfully delivered to the needy.", time: "15 mins ago" },
    { id: 3, message: "New volunteer courier joined near your area.", time: "1 hour ago" },
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
    <main className="min-h-screen bg-[#F9FAF8] text-[#1F2923]">
      <Navbar />

      <section className="relative overflow-hidden pt-12 pb-12 px-6 lg:px-12 border-b border-emerald-950/6 bg-gradient-to-b from-emerald-50/50 via-[#F9FAF8] to-[#F9FAF8]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 rounded-full text-xs font-semibold text-emerald-800 border border-emerald-200/60 mb-3 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Realtime Rescue Dispatch Stream
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            Activity & System Alerts
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Instant updates on courier claims, custody progress, and verified delivery confirmations.
          </p>
        </div>
      </section>

      <section className="py-10 px-6 flex flex-col items-center gap-3.5 max-w-2xl mx-auto">
        {loading && (
          <div className="w-full space-y-3">
            <div className="h-20 rounded-2xl bg-white border border-emerald-950/8 shadow-premium-xs animate-shimmer" />
            <div className="h-20 rounded-2xl bg-white border border-emerald-950/8 shadow-premium-xs animate-shimmer" />
          </div>
        )}

        {!loading && notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className="w-full bg-white shadow-premium-xs hover:shadow-premium transition-all duration-200 rounded-2xl border border-emerald-950/8 p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3.5 text-left pr-4">
                <span className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200/60">
                  🔔
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">⏰ {n.time}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(n.id)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-xs"
              >
                Dismiss
              </Button>
            </div>
          ))
        ) : (
          !loading && (
            <div className="text-center bg-white p-12 rounded-2xl border border-emerald-950/8 shadow-premium-xs max-w-md mx-auto">
              <span className="text-3xl">✨</span>
              <p className="text-sm font-semibold text-gray-900 mt-2">All Caught Up</p>
              <p className="text-xs text-gray-400 mt-1">No pending activity alerts right now.</p>
            </div>
          )
        )}
      </section>
    </main>
  );
}
