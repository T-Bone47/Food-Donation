"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { donationsApi } from "@/lib/api-client";

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
    <main className="min-h-screen bg-[#F9FAF8] text-[#1F2923]">
      <Navbar />

      <div className="py-12 px-6">
        <div className="max-w-2xl mx-auto bg-white shadow-premium rounded-2xl p-8 border border-emerald-950/8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold rounded-full mb-3 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              FoodShare Verified Donor Dispatch
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Create Surplus Food Donation
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Your surplus food will be immediately visible to nearby field volunteers for rapid pickup and community shelter handover.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Number of Food Types */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Food Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Number of Different Food Items
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="numFoods"
                    value={numFoods}
                    onChange={handleNumFoodsChange}
                    placeholder="Number of food types"
                    className="w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none"
                    required
                  />
                </div>

                {/* Dropdowns for each food */}
                {Array.from({ length: numFoods }).map((_, index) => (
                  <div key={index}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Food Item #{index + 1}
                    </label>
                    <select
                      value={selectedFoods[index] || ""}
                      onChange={(e) => handleFoodSelection(index, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none bg-white"
                      required
                    >
                      <option value="">Select Food Type</option>
                      {foodOptions.map((food, i) => (
                        <option key={i} value={food}>
                          {food}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Number of Servings
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={foodData.quantity}
                    onChange={(e) => setFoodData({ ...foodData, quantity: e.target.value })}
                    placeholder="Number of Servings"
                    className="w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Prepared Time (HH:MM)
                  </label>
                  <input
                    type="text"
                    name="preparedTime"
                    value={foodData.preparedTime}
                    onChange={(e) => setFoodData({ ...foodData, preparedTime: e.target.value })}
                    placeholder="e.g. 12:30 PM"
                    className="w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Location Details</h3>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={getLocation}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-xs text-sm font-medium transition cursor-pointer"
                >
                  📍 Use My Current Location
                </button>
                <input
                  type="text"
                  name="pincode"
                  value={locationData.pincode}
                  onChange={handleLocationChange}
                  placeholder="Pincode"
                  className="w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none"
                />
                <input
                  type="text"
                  name="area"
                  value={locationData.area}
                  onChange={handleLocationChange}
                  placeholder="Area / Street"
                  className="w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none"
                />
                <input
                  type="text"
                  name="state"
                  value={locationData.state}
                  onChange={handleLocationChange}
                  placeholder="State"
                  className="w-full rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 p-2.5 text-sm outline-none"
                />
                <input
                  type="text"
                  name="country"
                  value={locationData.country}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2.5 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Map Section */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-gray-500 font-medium text-xs">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 text-center">
                Select Location Using Map
              </h3>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9856515405814!2d77.5945627!3d12.9715987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru!5e0!3m2!1sen!2sin!4v1694800000000!5m2!1sen!2sin"
                width="100%"
                height="240"
                allowFullScreen
                loading="lazy"
                className="rounded-lg shadow-sm border border-gray-200"
              ></iframe>
              <p className="text-xs text-gray-500 mt-2 text-center">
                📍 Drag/zoom the map to confirm your exact location.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-6 py-4 rounded-xl font-bold shadow-premium transition cursor-pointer disabled:bg-gray-300 flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Broadcasting to Courier Fleet...
                </span>
              ) : (
                <>
                  <span>Broadcast Food Rescue Request</span>
                  <span>🚀</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
