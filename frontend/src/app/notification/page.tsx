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
    <main className="min-h-screen bg-green-50">
      <Navbar />

      <section className="bg-gradient-to-b from-green-100 via-green-50 to-green-50 py-12 px-6 text-center border-b border-green-100/60">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/80 rounded-full text-xs font-semibold text-green-800 border border-green-200 mb-3 shadow-2xs">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Realtime Rescue Feed
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight mb-2">
          Platform Activity & Alerts
        </h1>
        <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto">
          Stay updated on custody handoffs, volunteer claims, and completed deliveries in real time.
        </p>
      </section>

      <section className="py-8 px-6 flex flex-col items-center gap-4 max-w-2xl mx-auto">
        {loading && <p className="text-gray-500 py-4">Checking for new updates...</p>}

        {!loading && notifications.length > 0 ? (
          notifications.map((n) => (
            <Card
              key={n.id}
              className="w-full bg-white shadow-md hover:shadow-lg transition-all rounded-xl border border-green-100"
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div className="text-left pr-4">
                  <p className="text-base font-semibold text-green-800">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">⏰ {n.time}</p>
                </div>
                <Button
                  variant="ghost"
                  className="text-green-600 hover:text-green-800 text-xs font-semibold cursor-pointer shrink-0"
                  onClick={() => handleDismiss(n.id)}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          !loading && <p className="text-gray-600 mt-8">No new notifications</p>
        )}
      </section>
    </main>
  );
}
