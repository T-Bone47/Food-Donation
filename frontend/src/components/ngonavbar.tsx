"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/session";

export default function NgoNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      sessionStorage.clear();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  const currentTab = pathname.includes("history")
    ? "history"
    : pathname.includes("incoming")
    ? "incoming"
    : pathname.startsWith("/notification")
    ? "notification"
    : pathname.startsWith("/profile")
    ? "profile"
    : "hub";

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-40">
      <Link href="/ngodash" className="text-2xl font-bold text-green-700 flex items-center gap-2">
        <span>FeedChain NGO</span>
      </Link>

      <div className="w-[460px] max-w-full hidden md:block">
        <Tabs value={currentTab} className="w-full">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="hub" onClick={() => handleTabClick("/ngodash")}>
              Receiving Hub
            </TabsTrigger>
            <TabsTrigger value="incoming" onClick={() => handleTabClick("/ngodash?tab=incoming")}>
              Incoming Bay
            </TabsTrigger>
            <TabsTrigger value="history" onClick={() => handleTabClick("/ngodash?tab=history")}>
              Intake History
            </TabsTrigger>
            <TabsTrigger value="notification" onClick={() => handleTabClick("/notification")}>
              Notification
            </TabsTrigger>
            <TabsTrigger value="profile" onClick={() => handleTabClick("/profile")}>
              Profile
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer outline-none">
            {mounted && user?.name ? user.name.split(" ")[0] : "NGO Partner"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl rounded-xl p-2 border border-gray-100">
            <DropdownMenuLabel className="font-semibold text-green-800">
              {user?.organization || user?.name || "NGO Partner"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-gray-500 py-1">
              Role: <span className="font-medium text-gray-800 ml-1">NGO</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-gray-500 py-1">
              Email: <span className="font-medium text-gray-800 ml-1 truncate">{user?.email || "—"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/ngodash")}
              className="cursor-pointer hover:bg-green-50 text-green-700 text-sm py-1.5"
            >
              Receiving Overview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/ngodash?tab=incoming")}
              className="cursor-pointer hover:bg-green-50 text-green-700 text-sm py-1.5"
            >
              Inspect Deliveries
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 hover:bg-red-50 text-sm py-1.5"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

