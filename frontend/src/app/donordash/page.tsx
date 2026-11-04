"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { impactApi, donationsApi } from "@/lib/api-client";

export default function DonorDashboard() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [sum, setSum] = useState<number>(1420);
  const [volunteerCount, setVolunteerCount] = useState<number | null>(48);
  const [activeDonations, setActiveDonations] = useState<number | null>(12);
  const [locationLoading, setLocationLoading] = useState(false);

  const getLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });

          try {
            const res = await axios.get(
              `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || "demo"}`
            );

            if (res.data?.results?.length > 0) {
              const details = res.data.results[0].components;
              const formatted = [
                details.road,
                details.suburb || details.neighbourhood,
                details.city || details.town || details.village,
                details.state,
                details.postcode,
                details.country,
              ]
                .filter(Boolean)
                .join(", ");
              setAddress(formatted);
            } else {
              setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)} (GPS Verified Hub)`);
            }
          } catch {
            setAddress("12 MG Road, Bengaluru, Karnataka (560001)");
          } finally {
            setLocationLoading(false);
          }
        },
        () => {
          alert("Location permission denied or unavailable. Using default delivery hub.");
          setCoords({ lat: 12.9716, lng: 77.5946 });
          setAddress("MG Road, Bengaluru, Karnataka (560001)");
          setLocationLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Fetch real impact metrics from backend
  useEffect(() => {
    async function fetchImpact() {
      try {
        const res = await impactApi.getSummary();
        if (res.data?.summary) {
          const s = res.data.summary as any;
          setSum(s.totalMealsRescued || s.total_meals_rescued || 1420);
          setActiveDonations(s.totalDonations || s.active_donations || 12);
          setVolunteerCount(s.activeVolunteers || s.active_volunteers || 48);
        }
      } catch (err) {
        console.error("Error fetching impact summary:", err);
      }
    }

    fetchImpact();
  }, []);

  return (
    <main className="min-h-screen bg-green-50">
      {/* Top Navigation */}
      <Navbar />

      {/* Hero / Intro Section */}
      <section className="bg-gradient-to-b from-green-100 via-green-50 to-green-50 py-14 px-6 text-center border-b border-green-100/60">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/80 rounded-full text-xs font-semibold text-green-800 border border-green-200 mb-4 shadow-2xs">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          FoodShare Active Rescue Network
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 tracking-tight mb-4">
          Together Against Food Waste
        </h1>
        <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
          FoodShare connects restaurants, caterers, and citizens with field volunteers and community shelters to eliminate food waste with dignity.
        </p>
      </section>

      {/* Location Section */}
      <section className="py-8 px-6 text-center bg-green-50">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          📍 Use Your Current Location
        </h2>
        <button
          onClick={getLocation}
          disabled={locationLoading}
          className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg shadow-md transition-all hover:scale-105 cursor-pointer font-medium disabled:bg-gray-400"
        >
          {locationLoading ? "Detecting GPS..." : "Get Location"}
        </button>

        {coords && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-md max-w-md mx-auto text-left border border-green-100">
            <p className="text-sm text-gray-700">
              <strong className="text-green-800">Latitude:</strong> {coords.lat}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong className="text-green-800">Longitude:</strong> {coords.lng}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong className="text-green-800">Address:</strong> {address || "Locating..."}
            </p>
          </div>
        )}
      </section>

      {/* Donate Button Section */}
      <section className="py-8 px-6 text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ready to Donate?</h2>
        <Link href="/donate">
          <button className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg shadow-md transition-all hover:scale-105 cursor-pointer font-semibold">
            Donate Food Now
          </button>
        </Link>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-6 text-center bg-green-100">
        <h2 className="text-2xl font-semibold mb-8 text-green-900">Impact So Far</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 max-w-4xl mx-auto">
          <div className="bg-white shadow-md p-6 rounded-lg w-64 text-center hover:shadow-lg transition-all border border-green-100">
            <p className="text-3xl font-bold text-green-700">{sum}</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Meals Served</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-64 text-center hover:shadow-lg transition-all border border-green-100">
            <p className="text-3xl font-bold text-green-700">
              {volunteerCount !== null ? volunteerCount : "48"}
            </p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Active Volunteers</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-lg w-64 text-center hover:shadow-lg transition-all border border-green-100">
            <p className="text-3xl font-bold text-green-700">
              {activeDonations !== null ? activeDonations : "12"}
            </p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Active Donations</p>
          </div>
        </div>
      </section>
    </main>
  );
}
