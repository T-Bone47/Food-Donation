"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { donationsApi } from "@/lib/api-client";
import { MapPin, Plus } from "lucide-react";

export default function DonatePage() {
  const router = useRouter();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [numFoods, setNumFoods] = useState(1);
  const [selectedFoods, setSelectedFoods] = useState<string[]>([""]);
  const [foodData, setFoodData] = useState({
    quantity: "25",
    preparedTime: "12:00",
  });
  const [locationData, setLocationData] = useState({
    pincode: "560001",
    area: "MG Road",
    state: "Karnataka",
    country: "India",
  });
  const [loading, setLoading] = useState(false);

  // Food options matching the reference project dataset
  const foodOptions = [
    "Chapati",
    "Biryani",
    "Rice",
    "Sambar",
    "Pulao",
    "Curd Rice",
    "Idli",
    "Dosa",
    "Upma",
    "Poha",
    "Paratha",
    "Veg Curry",
    "Dal",
    "Paneer Curry",
    "Chicken Curry",
    "Fish Curry",
    "Egg Curry",
    "Bread",
    "Sandwich",
    "Snacks",
    "Juice",
    "Sweets",
  ];

  // Handle number of food types
  const handleNumFoodsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value) || 1;
    setNumFoods(count);
    setSelectedFoods(Array(count).fill(""));
  };

  // Handle each food selection
  const handleFoodSelection = (index: number, value: string) => {
    const updated = [...selectedFoods];
    updated[index] = value;
    setSelectedFoods(updated);
  };

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationData({ ...locationData, [e.target.name]: e.target.value });
  };

  // Get current location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
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
            setLocationData({
              pincode: "560001",
              area: "MG Road, Bengaluru",
              state: "Karnataka",
              country: "India",
            });
          }
        },
        () => {
          setLocationData({
            pincode: "560001",
            area: "MG Road, Bengaluru",
            state: "Karnataka",
            country: "India",
          });
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Submit donation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const foodTypeString = selectedFoods.filter((f) => f !== "").join(", ") || "Fresh Cooked Meals";

      // Calculate safe ISO dates for backend schema
      const now = new Date();
      const expires = new Date(now.getTime() + 6 * 60 * 60 * 1000); // +6 hours
      const deadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 hours

      // Format payload to backend schema
      await donationsApi.create({
        title: foodTypeString,
        food_category: "Cooked Meals",
        quantity: parseInt(foodData.quantity, 10) || 20,
        unit: "servings",
        pickup_address: `${locationData.area}, ${locationData.state} (${locationData.pincode})`,
        area: locationData.area,
        state: locationData.state,
        pincode: locationData.pincode,
        expires_at: expires.toISOString(),
        pickup_deadline: deadline.toISOString(),
        prepared_at: now.toISOString(),
        description: `Fresh batch of ${foodTypeString}. Prepared at ${foodData.preparedTime}.`,
      });

      alert("Donation submitted successfully! Volunteers have been notified.");
      router.push("/donordash");
    } catch (error: any) {
      console.error("Error submitting donation:", error);
      alert(error.response?.data?.error?.message || "Failed to submit donation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EEF4EC] text-[#111827]">
      <Navbar />

      <div className="py-8 px-6 max-w-2xl mx-auto space-y-6">
        {/* Deep Forest Pine Command Banner */}
        <div className="bg-[#0B331E] border border-[#184F31] rounded-lg p-6 text-white shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#13492B] text-emerald-300 border border-[#21663F]">
              DISPATCH DESK
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
              REALTIME INTAKE ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Food Donation Dispatch
          </h1>
          <p className="text-xs text-emerald-100/75 mt-1">
            Log surplus inventory for rapid volunteer courier pickup and certified community distribution
          </p>
        </div>

        <div className="manifest-docket p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Number of Food Types */}
            <div>
              <h2 className="text-sm font-bold text-[#0B331E] mb-3 pb-2 border-b border-[#CBDBC7]">
                Food Batch Logistics
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    Number of Different Food Items
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="numFoods"
                    value={numFoods}
                    onChange={handleNumFoodsChange}
                    className="w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
                    required
                  />
                </div>

                {/* Dropdowns for each food */}
                {Array.from({ length: numFoods }).map((_, index) => (
                  <div key={index}>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Food Item #{index + 1}
                    </label>
                    <select
                      value={selectedFoods[index] || ""}
                      onChange={(e) => handleFoodSelection(index, e.target.value)}
                      className="w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900 cursor-pointer"
                      required
                    >
                      <option value="">Select Food Item</option>
                      {foodOptions.map((food, i) => (
                        <option key={i} value={food}>
                          {food}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Servings / Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      name="quantity"
                      value={foodData.quantity}
                      onChange={(e) => setFoodData({ ...foodData, quantity: e.target.value })}
                      placeholder="e.g. 25"
                      className="w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">
                      Prepared Time (HH:MM)
                    </label>
                    <input
                      type="text"
                      name="preparedTime"
                      value={foodData.preparedTime}
                      onChange={(e) => setFoodData({ ...foodData, preparedTime: e.target.value })}
                      placeholder="e.g. 12:30 PM"
                      className="w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#CBDBC7]">
                <h2 className="text-sm font-bold text-[#0B331E]">
                  Facility Pickup Address
                </h2>
                <button
                  type="button"
                  onClick={getLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-[#E2ECE0] hover:bg-[#D5E4D2] text-[#135936] border border-[#CBDBC7] rounded transition cursor-pointer"
                >
                  <MapPin className="size-3 text-[#165E39]" />
                  <span>Auto-Detect GPS</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      name="pincode"
                      value={locationData.pincode}
                      onChange={handleLocationChange}
                      className="w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Area / Street</label>
                    <input
                      type="text"
                      name="area"
                      value={locationData.area}
                      onChange={handleLocationChange}
                      className="w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      name="state"
                      value={locationData.state}
                      onChange={handleLocationChange}
                      className="w-full rounded-md border border-[#CBDBC7] bg-[#FAFDF8] p-2 text-sm focus:outline-none focus:border-[#135936] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={locationData.country}
                      readOnly
                      className="w-full rounded-md border border-[#CBDBC7] bg-[#EBF2E9] p-2 text-sm text-gray-600 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Map Reference */}
            <div>
              <p className="text-xs font-bold text-[#0B331E] mb-2">
                Pickup Zone Reference
              </p>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9856515405814!2d77.5945627!3d12.9715987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru!5e0!3m2!1sen!2sin!4v1694800000000!5m2!1sen!2sin"
                width="100%"
                height="180"
                allowFullScreen
                loading="lazy"
                className="rounded-md border border-[#CBDBC7]"
              ></iframe>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#135936] hover:bg-[#0D4026] text-white px-4 py-3 rounded-md text-sm font-bold transition-colors cursor-pointer disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                <span>Dispatching to Couriers...</span>
              ) : (
                <span>Schedule Food Rescue Dispatch</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
