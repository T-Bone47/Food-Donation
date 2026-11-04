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
    <nav className="bg-white/90 backdrop-blur-xl border-b border-emerald-950/8 shadow-premium-xs px-6 lg:px-10 py-3 flex justify-between items-center sticky top-0 z-40 transition-all">
      <Logo href="/donordash" roleBadge="Donor" size="md" />

      {/* Center Nav Tabs */}
      <div className="w-[450px] max-w-full hidden md:block">
        <Tabs value={currentTab} className="w-full">
          <TabsList className="w-full justify-center bg-emerald-950/4 p-1 rounded-full border border-emerald-950/6">
            <TabsTrigger
              value="home"
              onClick={() => handleTabClick("/donordash")}
              className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all"
            >
              Home
            </TabsTrigger>
            <TabsTrigger
              value="myservice"
              onClick={() => handleTabClick("/mydonations")}
              className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all"
            >
              My Donations
            </TabsTrigger>
            <TabsTrigger
              value="notification"
              onClick={() => handleTabClick("/notification")}
              className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Alerts</span>
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              onClick={() => handleTabClick("/profile")}
              className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all"
            >
              Profile
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/donate")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition hover:scale-102 active:scale-98 cursor-pointer"
        >
          <span>+ Donate Food</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200/60 transition cursor-pointer outline-none">
            <span className="size-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
              {mounted && user?.name ? user.name[0].toUpperCase() : "U"}
            </span>
            <span>{mounted && user?.name ? user.name.split(" ")[0] : "Account"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl rounded-xl p-2 border border-gray-100">
            <DropdownMenuLabel className="font-semibold text-emerald-950">
              {user?.name || "User Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-gray-500 py-1">
              Role: <span className="font-semibold text-emerald-800 ml-1">{user?.role || "Donor"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-gray-500 py-1">
              Email: <span className="font-medium text-gray-800 ml-1 truncate">{user?.email || "—"}</span>
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

