"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { authApi } from "@/lib/api-client";
import { Logo } from "@/components/ui/Logo";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState({
    pincode: "",
    area: "",
    state: "",
    country: "India",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationData({ ...locationData, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        try {
          const res = await axios.get(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || "demo"}`
          );

          if (res.data?.results?.length > 0) {
            const details = res.data.results[0].components;
            setLocationData({
              pincode: details.postcode || "560001",
              area: details.suburb || details.city || details.town || "Bengaluru",
              state: details.state || "Karnataka",
              country: details.country || "India",
            });
          }
        } catch {
          // Fallback location for smooth user experience
          setLocationData({
            pincode: "560001",
            area: "MG Road, Bengaluru",
            state: "Karnataka",
            country: "India",
          });
        }
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      alert("Please select a role before signing up.");
      return;
    }

    setLoading(true);
    try {
      // Connect to real backend API
      const res = await authApi.signup({
        name,
        email,
        password,
        role: role as any,
        phonenumber,
        organization: organization || undefined,
        pincode: locationData.pincode || undefined,
        area: locationData.area || undefined,
        state: locationData.state || undefined,
        country: locationData.country || "India",
      });

      alert("Signup successful! You can now log in.");
      router.push("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      alert(err.response?.data?.error?.message || err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: "donor" | "volunteer" | "ngo" | "admin") => {
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
    } catch (e) {
      console.error("Demo login error:", e);
      router.push("/login");
    }
  };

  // Step 1: Role selection
  if (!role) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat p-6 relative"
        style={{ backgroundImage: "url('/images/signupbg.png')" }}
      >
        <div className="absolute inset-0 bg-green-950/40 backdrop-blur-xs" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl p-8 sm:p-10 w-full max-w-md text-center border border-green-100"
        >
          <div className="flex justify-center mb-5">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Join the Food Rescue Mission 🌍
          </h2>
          <p className="text-gray-500 mb-6 text-xs">Choose your role to get started:</p>

          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setRole("Donor")}
              className="py-3 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700 transition cursor-pointer"
            >
              Food Donor (Restaurant / Caterer / Individual)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setRole("Volunteer")}
              className="py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition cursor-pointer"
            >
              Field Volunteer (Food Rescue & Delivery)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setRole("NGO")}
              className="py-3 bg-purple-600 text-white rounded-xl font-semibold shadow-md hover:bg-purple-700 transition cursor-pointer"
            >
              NGO / Community Shelter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setRole("Admin")}
              className="py-3 bg-emerald-800 text-white rounded-xl font-semibold shadow-md hover:bg-emerald-900 transition cursor-pointer"
            >
              Platform Administrator
            </motion.button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Or Presentation Demo</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo("donor")}
              className="p-2 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 font-medium"
            >
              ⚡ Demo Donor
            </button>
            <button
              onClick={() => handleQuickDemo("volunteer")}
              className="p-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 font-medium"
            >
              ⚡ Demo Volunteer
            </button>
            <button
              onClick={() => handleQuickDemo("ngo")}
              className="p-2 border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-50 font-medium"
            >
              ⚡ Demo NGO
            </button>
            <button
              onClick={() => handleQuickDemo("admin")}
              className="p-2 border border-emerald-300 rounded-lg text-emerald-800 hover:bg-emerald-50 font-medium"
            >
              ⚡ Demo Admin
            </button>
          </div>

          <p className="text-sm text-gray-600 text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-green-700 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </motion.div>
      </div>
    );
  }

  // Step 2: Signup form for selected role
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat p-6 relative py-12"
      style={{ backgroundImage: "url('/images/signupbg.png')" }}
    >
      <div className="absolute inset-0 bg-green-950/40 backdrop-blur-xs" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl p-8 sm:p-10 w-full max-w-xl"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <Logo size="sm" roleBadge={role} />
          <button
            onClick={() => setRole(null)}
            className="text-xs text-gray-500 hover:text-green-700 underline cursor-pointer"
          >
            ← Change Role
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm outline-none"
              required
            />
          </div>

          {(role === "Donor" || role === "NGO") && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization / Restaurant Name</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Business or foundation name"
                className="mt-1 w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email ID</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={phonenumber}
              onChange={(e) => setPhonenumber(e.target.value)}
              placeholder="+91 9876543210"
              className="mt-1 w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="mt-1 w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm outline-none"
              required
            />
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Location Details</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={getLocation}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xs transition cursor-pointer"
              >
                📍 Use My Current Location
              </button>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="pincode"
                  value={locationData.pincode}
                  onChange={handleLocationChange}
                  placeholder="Pincode"
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
                <input
                  type="text"
                  name="area"
                  value={locationData.area}
                  onChange={handleLocationChange}
                  placeholder="Area / Locality"
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="state"
                  value={locationData.state}
                  onChange={handleLocationChange}
                  placeholder="State"
                  className="rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
                <input
                  type="text"
                  name="country"
                  value={locationData.country}
                  readOnly
                  className="rounded-lg border border-gray-300 bg-gray-100 p-2 text-sm text-gray-500"
                />
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-semibold text-base shadow-md transition cursor-pointer mt-4 disabled:bg-gray-400"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </motion.button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-green-700 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
