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

export default function Navbar() {
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

  const currentTab = pathname.startsWith("/mydonations")
    ? "myservice"
    : pathname.startsWith("/notification")
    ? "notification"
    : pathname.startsWith("/profile")
    ? "profile"
    : "home";

  return (
    <nav className="bg-white border-b border-gray-200 px-6 lg:px-8 py-2.5 flex justify-between items-center sticky top-0 z-40">
      <Logo href="/donordash" roleBadge="Donor" size="md" />

      {/* Center Nav Tabs */}
      <div className="w-[420px] max-w-full hidden md:block">
        <Tabs value={currentTab} className="w-full">
          <TabsList className="w-full justify-center bg-gray-100/80 p-0.5 rounded-md border border-gray-200">
            <TabsTrigger
              value="home"
              onClick={() => handleTabClick("/donordash")}
              className="rounded px-3 py-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none transition-none cursor-pointer"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="myservice"
              onClick={() => handleTabClick("/mydonations")}
              className="rounded px-3 py-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none transition-none cursor-pointer"
            >
              My Donations
            </TabsTrigger>
            <TabsTrigger
              value="notification"
              onClick={() => handleTabClick("/notification")}
              className="rounded px-3 py-1 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-none transition-none flex items-center gap-1.5 cursor-pointer"
            >
              <span>Alerts</span>
              <span className="size-1.5 rounded-full bg-emerald-600" />
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

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => router.push("/donate")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
        >
          <span>+ Create Donation</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-200 transition-colors cursor-pointer outline-none">
            <span className="size-5 rounded bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-[10px]">
              {mounted && user?.name ? user.name[0].toUpperCase() : "U"}
            </span>
            <span>{mounted && user?.name ? user.name.split(" ")[0] : "Account"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white shadow-md rounded-md p-1.5 border border-gray-200">
            <DropdownMenuLabel className="font-semibold text-gray-900 text-xs">
              {user?.name || "User Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem className="text-xs text-gray-600 py-1 cursor-default">
              Role: <span className="font-semibold text-gray-900 ml-1">{user?.role || "Donor"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-gray-600 py-1 cursor-default">
              Email: <span className="font-medium text-gray-900 ml-1 truncate">{user?.email || "—"}</span>
            </DropdownMenuItem>
            {user?.phonenumber && (
              <DropdownMenuItem className="text-xs text-gray-500 py-1">
                Phone: <span className="font-medium text-gray-800 ml-1">{user.phonenumber}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/donordash")}
              className="cursor-pointer hover:bg-emerald-50 text-emerald-800 text-xs py-1.5 font-medium rounded-lg"
            >
              Donor Overview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/donate")}
              className="cursor-pointer hover:bg-emerald-50 text-emerald-800 text-xs py-1.5 font-medium rounded-lg"
            >
              Create Food Donation
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/mydonations")}
              className="cursor-pointer hover:bg-emerald-50 text-emerald-800 text-xs py-1.5 font-medium rounded-lg"
            >
              Custody Tracking
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 hover:bg-red-50 text-xs py-1.5 font-medium rounded-lg"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

