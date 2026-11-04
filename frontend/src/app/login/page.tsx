"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { authApi } from "@/lib/api-client";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlesubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      const { user, token } = res.data;

      if (user && token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userRole", user.role);

        // Role-based redirect
        const role = user.role?.toLowerCase();
        if (role === "volunteer") {
          router.push("/volunteerdash");
        } else if (role === "donor") {
          router.push("/donordash");
        } else if (role === "ngo") {
          router.push("/ngodash");
        } else if (role === "admin") {
          router.push("/adminpage");
        } else {
          router.push("/donordash");
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error?.message || err.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: "donor" | "volunteer" | "ngo" | "admin") => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/v1/demo/session", { role: demoRole });
      const { user, token } = res.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userRole", user.role);

      const target =
        demoRole === "donor"
          ? "/donordash"
          : demoRole === "volunteer"
          ? "/volunteerdash"
          : demoRole === "ngo"
          ? "/ngodash"
          : "/adminpage";
      router.push(target);
    } catch (e: any) {
      console.error("Demo login error:", e);
      alert("Demo session error. Ensure backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/signupbg.png')" }}
      ></div>

      {/* Overlay for legibility */}
      <div className="absolute inset-0 bg-slate-900/30"></div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 manifest-docket p-8 max-w-md w-full shadow-xl"
      >
        <div className="flex justify-center mb-5">
          <Logo size="lg" />
        </div>
        <h2 className="text-xl font-bold text-[#0B331E] text-center mb-1">
          Sign In to FoodShare
        </h2>
        <p className="text-xs text-gray-600 text-center mb-6">
          Access your donor, volunteer, NGO, or administrator operations console
        </p>
        <form onSubmit={handlesubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-800">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2.5 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-800">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2.5 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#135936] hover:bg-[#0D4026] text-white font-bold py-2.5 px-4 rounded-md text-sm transition-colors cursor-pointer disabled:bg-gray-300 shadow-xs"
          >
            {loading ? "Signing in..." : "Sign In to Operations"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px bg-[#CBDBC7] flex-1" />
          <span className="text-[11px] text-[#165E39] uppercase tracking-wider font-bold">Evaluation Demo Access</span>
          <div className="h-px bg-[#CBDBC7] flex-1" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickDemo("donor")}
            className="p-2.5 border border-[#CBDBC7] bg-[#E2ECE0] hover:bg-[#D5E4D2] rounded text-[#0B331E] font-bold transition cursor-pointer"
          >
            Demo Donor
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("volunteer")}
            className="p-2.5 border border-[#CBDBC7] bg-[#E2ECE0] hover:bg-[#D5E4D2] rounded text-[#0B331E] font-bold transition cursor-pointer"
          >
            Demo Volunteer
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("ngo")}
            className="p-2.5 border border-[#CBDBC7] bg-[#E2ECE0] hover:bg-[#D5E4D2] rounded text-[#0B331E] font-bold transition cursor-pointer"
          >
            Demo NGO
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("admin")}
            className="p-2.5 border border-[#CBDBC7] bg-[#E2ECE0] hover:bg-[#D5E4D2] rounded text-[#0B331E] font-bold transition cursor-pointer"
          >
            Demo Admin
          </button>
        </div>

        <p className="text-xs text-gray-700 text-center mt-6 font-medium">
          Don’t have an account?{" "}
          <Link
            href="/"
            className="text-[#135936] font-bold hover:underline"
          >
            Create an Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
