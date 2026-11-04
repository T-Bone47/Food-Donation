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
import { Logo } from "@/components/ui/Logo";

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
    <nav className="bg-white border-b border-gray-200 px-6 lg:px-8 py-2.5 flex justify-between items-center sticky top-0 z-40">
      <Logo href="/ngodash" roleBadge="NGO Hub" size="md" />

      <div className="w-[420px] max-w-full hidden md:block">
        <Tabs value={currentTab} className="w-full">
          <TabsList className="w-full justify-center bg-gray-100/80 p-0.5 rounded-md border border-gray-200">
            <TabsTrigger
              value="hub"
              onClick={() => handleTabClick("/ngodash")}
              className="rounded px-3 py-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none transition-none cursor-pointer"
            >
              Receiving Hub
            </TabsTrigger>
            <TabsTrigger
              value="incoming"
              onClick={() => handleTabClick("/ngodash?tab=incoming")}
              className="rounded px-3 py-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none transition-none cursor-pointer"
            >
              Incoming Bay
            </TabsTrigger>
            <TabsTrigger
              value="history"
              onClick={() => handleTabClick("/ngodash?tab=history")}
              className="rounded px-3 py-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none transition-none cursor-pointer"
            >
              Intake History
            </TabsTrigger>
            <TabsTrigger
              value="notification"
              onClick={() => handleTabClick("/notification")}
              className="rounded px-3 py-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none transition-none cursor-pointer"
            >
              Alerts
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              onClick={() => handleTabClick("/profile")}
              className="rounded px-3 py-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none transition-none cursor-pointer"
            >
              Profile
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center gap-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-200 transition-colors cursor-pointer outline-none">
            <span className="size-5 rounded bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-[10px]">
              {mounted && user?.name ? user.name[0].toUpperCase() : "N"}
            </span>
            <span>{mounted && user?.name ? user.name.split(" ")[0] : "NGO Partner"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white shadow-md rounded-md p-1.5 border border-gray-200">
            <DropdownMenuLabel className="font-semibold text-gray-900 text-xs">
              {user?.organization || user?.name || "NGO Partner"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem className="text-xs text-gray-600 py-1 cursor-default">
              Role: <span className="font-semibold text-gray-900 ml-1">NGO</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-gray-600 py-1 cursor-default">
              Email: <span className="font-medium text-gray-900 ml-1 truncate">{user?.email || "—"}</span>
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

