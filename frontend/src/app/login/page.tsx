"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { authApi } from "@/lib/api-client";

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

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/85 to-green-200/85 backdrop-blur-xs"></div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white shadow-xl rounded-2xl p-8 max-w-md w-full border border-green-100"
      >
        <h2 className="text-2xl font-bold text-green-700 text-center mb-6">
          Welcome Back 👋
        </h2>
        <form onSubmit={handlesubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email ID
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all cursor-pointer shadow-xs disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Instant Demo Access</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickDemo("donor")}
            className="p-2 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 font-medium transition cursor-pointer"
          >
            ⚡ Demo Donor
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("volunteer")}
            className="p-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 font-medium transition cursor-pointer"
          >
            ⚡ Demo Volunteer
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("ngo")}
            className="p-2 border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-50 font-medium transition cursor-pointer"
          >
            ⚡ Demo NGO
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("admin")}
            className="p-2 border border-emerald-300 rounded-lg text-emerald-800 hover:bg-emerald-50 font-medium transition cursor-pointer"
          >
            ⚡ Demo Admin
          </button>
        </div>

        <p className="text-sm text-gray-600 text-center mt-6">
          Don’t have an account?{" "}
          <Link
            href="/"
            className="text-green-600 font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </p>
        <p className="text-xs text-gray-500 text-center mt-2">
          Together, let’s reduce food waste and feed communities 💚
        </p>
      </motion.div>
    </div>
  );
}
