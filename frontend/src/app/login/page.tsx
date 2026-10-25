"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { authApi } from "@/lib/api-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      const { user, token } = res.data;

      // Store auth token and user data
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));

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
        router.push("/");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error.message || "Login failed");
      } else {
        setError("Login failed. Please try again.");
      }
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
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-green-200/80"></div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white shadow-xl rounded-2xl p-8 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold text-green-700 text-center mb-6">
          Welcome Back 👋
        </h2>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Email ID
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 p-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:bg-green-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-gray-600 text-center mt-4">
          Don't have an account?{" "}
          <Link
            href="/"
            className="text-green-600 font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </p>
        <p className="text-sm text-gray-500 text-center mt-2">
          Together, let's reduce food waste and feed communities 💚
        </p>
      </motion.div>
    </div>
  );
}