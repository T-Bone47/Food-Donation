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
        <div className="absolute inset-0 bg-slate-900/35" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 manifest-docket p-8 w-full max-w-md text-center shadow-xl"
        >
          <div className="flex justify-center mb-5">
            <Logo size="lg" />
          </div>
          <h2 className="text-xl font-bold text-[#0B331E] mb-1">
            Join the FoodShare Network
          </h2>
          <p className="text-gray-600 mb-6 text-xs">Select your operational participation role:</p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setRole("Donor")}
              className="py-2.5 px-4 bg-[#135936] text-white rounded-md text-xs font-bold hover:bg-[#0D4026] transition cursor-pointer shadow-xs"
            >
              Food Donor (Restaurant / Caterer / Business)
            </button>
            <button
              onClick={() => setRole("Volunteer")}
              className="py-2.5 px-4 bg-[#0B331E] text-white rounded-md text-xs font-bold hover:bg-[#072415] transition cursor-pointer shadow-xs"
            >
              Field Volunteer (Food Courier)
            </button>
            <button
              onClick={() => setRole("NGO")}
              className="py-2.5 px-4 bg-[#E2ECE0] border border-[#CBDBC7] text-[#0B331E] rounded-md text-xs font-bold hover:bg-[#D5E4D2] transition cursor-pointer"
            >
              NGO / Community Receiving Shelter
            </button>
            <button
              onClick={() => setRole("Admin")}
              className="py-2.5 px-4 bg-[#EBF2E9] border border-[#CBDBC7] text-[#1E3E2B] rounded-md text-xs font-bold hover:bg-[#DCE7D9] transition cursor-pointer"
            >
              Platform Administrator
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px bg-[#CBDBC7] flex-1" />
            <span className="text-[11px] text-[#165E39] uppercase tracking-wider font-bold">Evaluation Demo Access</span>
            <div className="h-px bg-[#CBDBC7] flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo("donor")}
              className="p-2.5 border border-[#CBDBC7] bg-[#E2ECE0] hover:bg-[#D5E4D2] rounded text-[#0B331E] font-bold cursor-pointer transition"
            >
              Demo Donor
            </button>
            <button
              onClick={() => handleQuickDemo("volunteer")}
              className="p-2.5 border border-[#CBDBC7] bg-[#E2ECE0] hover:bg-[#D5E4D2] rounded text-[#0B331E] font-bold cursor-pointer transition"
            >
              Demo Volunteer
            </button>
            <button
              onClick={() => handleQuickDemo("ngo")}
              className="p-2.5 border border-[#CBDBC7] bg-[#E2ECE0] hover:bg-[#D5E4D2] rounded text-[#0B331E] font-bold cursor-pointer transition"
            >
              Demo NGO
            </button>
            <button
              onClick={() => handleQuickDemo("admin")}
              className="p-2.5 border border-[#CBDBC7] bg-[#E2ECE0] hover:bg-[#D5E4D2] rounded text-[#0B331E] font-bold cursor-pointer transition"
            >
              Demo Admin
            </button>
          </div>

          <p className="text-xs text-gray-700 text-center mt-6 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-[#135936] font-bold hover:underline">
              Sign In
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
      <div className="absolute inset-0 bg-slate-900/35" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 manifest-docket p-8 w-full max-w-xl shadow-xl"
      >
        <div className="flex justify-between items-center mb-6 border-b border-[#CBDBC7] pb-4">
          <Logo size="sm" roleBadge={role} />
          <button
            onClick={() => setRole(null)}
            className="text-xs text-[#135936] hover:text-[#0B331E] font-bold underline cursor-pointer"
          >
            ← Change Role
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-800">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full p-2.5 rounded-md border border-[#CBDBC7] bg-[#FAFDF8] text-sm focus:outline-none focus:border-[#135936] text-gray-900"
              required
            />
          </div>

          {(role === "Donor" || role === "NGO") && (
            <div>
              <label className="block text-xs font-semibold text-gray-800">Organization / Facility Name</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Business or foundation name"
                className="mt-1 w-full p-2.5 rounded-md border border-[#CBDBC7] bg-[#FAFDF8] text-sm focus:outline-none focus:border-[#135936] text-gray-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-800">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full p-2.5 rounded-md border border-[#CBDBC7] bg-[#FAFDF8] text-sm focus:outline-none focus:border-[#135936] text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-800">Phone Number</label>
            <input
              type="tel"
              value={phonenumber}
              onChange={(e) => setPhonenumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="mt-1 w-full p-2.5 rounded-md border border-[#CBDBC7] bg-[#FAFDF8] text-sm focus:outline-none focus:border-[#135936] text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-800">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="mt-1 w-full p-2.5 rounded-md border border-[#CBDBC7] bg-[#FAFDF8] text-sm focus:outline-none focus:border-[#135936] text-gray-900"
              required
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-800">Facility Location</span>
              <button
                type="button"
                onClick={getLocation}
                className="text-xs text-[#135936] hover:text-[#0B331E] font-bold cursor-pointer"
              >
                Auto-Detect GPS
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="pincode"
                  value={locationData.pincode}
                  onChange={handleLocationChange}
                  placeholder="Postal Code"
                  className="rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900 font-mono"
                />
                <input
                  type="text"
                  name="area"
                  value={locationData.area}
                  onChange={handleLocationChange}
                  placeholder="Area / Locality"
                  className="rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="state"
                  value={locationData.state}
                  onChange={handleLocationChange}
                  placeholder="State"
                  className="rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
                />
                <input
                  type="text"
                  name="country"
                  value={locationData.country}
                  readOnly
                  className="rounded-md border border-[#CBDBC7] bg-[#EBF2E9] p-2 text-sm text-gray-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#135936] hover:bg-[#0D4026] text-white py-2.5 rounded-md text-sm font-bold transition cursor-pointer mt-4 disabled:bg-gray-300 shadow-xs"
          >
            {loading ? "Creating Account..." : "Register Account"}
          </button>
        </form>

        <p className="text-xs text-gray-700 text-center mt-5 font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-[#135936] font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
