"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api-client";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [locationData, setLocationData] = useState({
    pincode: "",
    area: "",
    state: "",
    country: "India",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
          );
          const data = await res.json();

          if (data.results.length > 0) {
            const details = data.results[0].components;
            setLocationData({
              pincode: details.postcode || "",
              area:
                details.suburb ||
                details.city ||
                details.town ||
                details.village ||
                "",
              state: details.state || "",
              country: details.country || "India",
            });
          }
        } catch (error) {
          console.error("Error fetching location details:", error);
          alert("Failed to fetch location details.");
        }
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!role) {
      setError("Please select a role before signing up.");
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.signup({
        name,
        email,
        organization,
        password,
        phonenumber,
        role,
        ...locationData,
      });

      const { user, token } = res.data;

      // Store auth token and user data
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("Signup successful:", res.data);
      router.push("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.response?.data?.error) {
        const apiError = err.response.data.error;
        if (apiError.details && Array.isArray(apiError.details)) {
          setError(apiError.details.map((d: any) => d.message).join(", "));
        } else {
          setError(apiError.message || "Signup failed");
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Role selection
  if (!role) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat p-6"
        style={{ backgroundImage: "url('/images/signupbg.png')" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl p-10 w-full max-w-md text-center"
        >
          <h2 className="text-3xl font-extrabold text-green-700 mb-8">
            Join the Food Waste Network 🌍
          </h2>
          <p className="text-gray-600 mb-6">Choose your role to get started:</p>
          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRole("Donor")}
              className="py-3 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700 transition"
            >
              Donor
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRole("Volunteer")}
              className="py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition"
            >
              Volunteer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRole("NGO")}
              className="py-3 bg-purple-600 text-white rounded-xl font-semibold shadow-md hover:bg-purple-700 transition"
            >
              NGO
            </motion.button>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-600 mt-6"
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-green-700 font-semibold hover:underline"
            >
              Login here
            </Link>
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Step 2: Signup form UI
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat p-6"
      style={{ backgroundImage: "url('/images/signupbg.png')" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl p-10 w-full max-w-md"
      >
        <h2 className="text-3xl font-extrabold text-green-700 text-center mb-8">
          Sign Up as {role} 🌍
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
        <form onSubmit={handleSignup} className="space-y-5">
          {/* Name */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="mt-2 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:shadow-lg"
              required
            />
          </motion.div>

          {/* Organisation */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <label className="block text-sm font-medium text-gray-600">Organisation Name (optional)</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Organisation Name"
              className="mt-2 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:shadow-lg"
            />
          </motion.div>

          {/* Email */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <label className="block text-sm font-medium text-gray-600">Email ID</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="mt-2 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:shadow-lg"
              required
            />
          </motion.div>

          {/* Phone */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <label className="block text-sm font-medium text-gray-600">Phone Number</label>
            <input
              type="tel"
              value={phonenumber}
              onChange={(e) => setPhonenumber(e.target.value)}
              placeholder="Phone Number"
              className="mt-2 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:shadow-lg"
              required
            />
          </motion.div>

          {/* Password */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-2 w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:shadow-lg"
              required
              minLength={6}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Location Details
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={getLocation}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
              >
                Use My Current Location
              </button>
              <input
                type="text"
                name="pincode"
                value={locationData.pincode}
                onChange={handleLocationChange}
                placeholder="Pincode"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 p-2"
              />
              <input
                type="text"
                name="area"
                value={locationData.area}
                onChange={handleLocationChange}
                placeholder="Area"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 p-2"
              />
              <input
                type="text"
                name="state"
                value={locationData.state}
                onChange={handleLocationChange}
                placeholder="State"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 p-2"
              />
              <input
                type="text"
                name="country"
                value={locationData.country}
                readOnly
                className="w-full rounded-lg border-gray-300 bg-gray-100 p-2 cursor-not-allowed"
              />
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg shadow-md transition-all disabled:bg-green-400"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </motion.button>
        </form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm text-gray-600 text-center mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-green-700 font-semibold hover:underline">
            Login here
          </Link>
        </motion.p>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-sm text-gray-500 text-center mt-2">
          Together, let's reduce food waste and feed communities 💚
        </motion.p>
      </motion.div>
    </div>
  );
}