"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api-client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserData = {
  name: string;
  email: string;
  phonenumber?: string;
  role: string;
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Revoke the server-side session; ignore failures so local state is
      // always cleared even when offline.
      await authApi.logout();
    } catch {
      // no-op
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      router.push("/login");
    }
  };

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-green-700">FoodShare</div>
      <Tabs className="w-[400px]">
        <TabsList>
          <TabsTrigger
            value="home"
            onClick={() => handleTabClick("/donordash")}
          >
            Home
          </TabsTrigger>
          <TabsTrigger
            value="mydonations"
            onClick={() => handleTabClick("/mydonations")}
          >
            My Donations
          </TabsTrigger>
          <TabsTrigger
            value="notification"
            onClick={() => handleTabClick("/notification")}
          >
            Notification
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            onClick={() => handleTabClick("/profile")}
          >
            Profile
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg">
          My Account
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{user ? user.name : "User name"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{user?.role || "role"}</DropdownMenuItem>
          <DropdownMenuItem>{user?.email || "email"}</DropdownMenuItem>
          <DropdownMenuItem>
            {user?.phonenumber || "phone number"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
