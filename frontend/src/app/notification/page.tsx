"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/lib/api-client";

interface Notification {
  id: string;
  event_type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  channels: string[];
  delivery_status: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationsApi.getAll({ limit: 50 });
        setNotifications(res.data.notifications);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Error fetching notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("donation.created")) return "🆕";
    if (eventType.includes("donation.claimed")) return "✅";
    if (eventType.includes("pickup")) return "📦";
    if (eventType.includes("delivered")) return "🚚";
    if (eventType.includes("completed")) return "🎉";
    if (eventType.includes("cancelled")) return "❌";
    if (eventType.includes("expired")) return "⏰";
    if (eventType.includes("ngo.verification")) return "🏢";
    return "🔔";
  };

  return (
    <main className="min-h-screen bg-green-50">
      <Navbar />

      <section className="py-8 px-6 text-center bg-green-100">
        <h1 className="text-3xl font-bold text-green-800 mb-4">Notifications</h1>
        <p className="text-gray-700">Stay updated about your donations in real-time.</p>
      </section>

      <section className="py-8 px-6 flex flex-col items-center gap-4 max-w-3xl mx-auto">
        {loading && (
          <div className="w-full max-w-xl text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        )}

        {error && (
          <div className="w-full max-w-xl text-center py-12 text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="w-full max-w-xl text-center py-12">
            <p className="text-gray-600 mt-6">No new notifications</p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <>
            <div className="w-full max-w-xl flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                {notifications.filter((n) => !n.read).length} unread
              </h2>
              {notifications.some((n) => !n.read) && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="w-full max-w-xl space-y-3">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  className={`w-full bg-white shadow-md hover:shadow-lg transition-all rounded-xl ${n.read ? "opacity-70" : ""}`}
                >
                  <CardContent className="p-4 flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{getEventIcon(n.event_type)}</span>
                        <p className={`text-lg font-medium text-green-800 ${!n.read ? "font-bold" : ""}`}>
                          {n.title}
                        </p>
                      </div>
                      <p className="text-gray-700">{n.message}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-800"
                        onClick={() => handleDismiss(n.id)}
                      >
                        Dismiss
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}