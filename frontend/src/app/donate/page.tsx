"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { donationsApi } from "@/lib/api-client";

const FOOD_CATEGORIES = [
  "Cooked Meal",
  "Fresh Produce",
  "Non-Perishable",
  "Bakery",
  "Dairy",
  "Snacks",
  "Beverages",
  "Other",
];

const UNITS = ["servings", "kg", "packets", "liters", "boxes"];

export default function DonatePage() {
  const router = useRouter();

  const [foodData, setFoodData] = useState({
    title: "",
    description: "",
    food_category: "",
    quantity: "",
    unit: "servings",
    prepared_at: "",
    expires_at: "",
    pickup_deadline: "",
  });

  const [locationState, setLocationState] = useState({
    pickup_address: "",
    pincode: "",
    area: "",
    state: "",
    country: "India",
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFoodChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFoodData({ ...foodData, [name]: value });
  };

  // Fixed: use a separate handler for location fields that avoids computed property issues
  const handleLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof locationState
  ) => {
    setLocationState({ ...locationState, [field]: e.target.value });
  };

  const getLocation = () => {
    if (!process.env.NEXT_PUBLIC_OPENCAGE_API_KEY) {
      alert(
        "Location lookup is not configured. Please enter the pickup address and location manually."
      );
      return;
    }

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
            setLocationState({
              pickup_address: details.road || details.suburb || "",
              pincode: details.postcode || "",
              area: details.suburb || details.city || details.town || details.village || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setError("You must be logged in to submit a donation.");
      setLoading(false);
      return;
    }

    try {
      const donation = {
        title: foodData.title,
        description: foodData.description,
        food_category: foodData.food_category,
        quantity: Number(foodData.quantity),
        unit: foodData.unit,
        prepared_at: foodData.prepared_at || undefined,
        expires_at: foodData.expires_at,
        pickup_deadline: foodData.pickup_deadline,
        pickup_address: locationState.pickup_address,
        pincode: locationState.pincode,
        area: locationState.area,
        state: locationState.state,
        country: locationState.country,
        latitude: coords?.lat,
        longitude: coords?.lng,
      };

      await donationsApi.create(donation);
      setSuccess("Donation submitted successfully!");

      // Reset form
      setFoodData({
        title: "",
        description: "",
        food_category: "",
        quantity: "",
        unit: "servings",
        prepared_at: "",
        expires_at: "",
        pickup_deadline: "",
      });
      setLocationState({
        pickup_address: "",
        pincode: "",
        area: "",
        state: "",
        country: "India",
      });
      setCoords(null);

      setTimeout(() => router.push("/donordash"), 1500);
    } catch (err: any) {
      console.error("Error submitting donation:", err);
      if (err.response?.data?.error) {
        const apiError = err.response.data.error;
        if (apiError.details && Array.isArray(apiError.details)) {
          setError(apiError.details.map((d: any) => d.message).join(", "));
        } else {
          setError(apiError.message || "Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto bg-card shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-brand-primary mb-6 text-center">
          Donate Food
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-error-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-success/10 text-success rounded-lg text-success-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Food Details */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Food Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Food Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={foodData.title}
                  onChange={handleFoodChange}
                  placeholder="e.g., Vegetarian Thali, Sandwiches, Biryani"
                  maxLength={200}
                  className="mt-1 w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors hover:shadow-sm lg:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <textarea
                  name="description"
                  value={foodData.description}
                  onChange={handleFoodChange}
                  placeholder="Describe the food items, special instructions, etc."
                  maxLength={2000}
                  rows={3}
                  className="mt-1 w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors resize-h lg:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Food Category *
                </label>
                <select
                  name="food_category"
                  value={foodData.food_category}
                  onChange={handleFoodChange}
                  className="mt-1 w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                  required
                >
                  <option value="">Select Category</option>
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={foodData.quantity}
                    onChange={handleFoodChange}
                    placeholder="e.g., 50"
                    className="mt-1 w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                    required
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={foodData.unit}
                    onChange={handleFoodChange}
                    className="mt-1 w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                    required
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Prepared At (optional)
                </label>
                <input
                  type="datetime-local"
                  name="prepared_at"
                  value={foodData.prepared_at}
                  onChange={handleFoodChange}
                  className="mt-1 w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Expiry Date/Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="expires_at"
                    value={foodData.expires_at}
                    onChange={handleFoodChange}
                    className="mt-1 w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Pickup Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    name="pickup_deadline"
                    value={foodData.pickup_deadline}
                    onChange={handleFoodChange}
                    className="mt-1 w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Must be on or before the expiry time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Location Details
            </h3>

            <div className="space-y-4">
              <button
                type="button"
                onClick={getLocation}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15m-2 0a2 2 0 100-4 2 2 0 100 4m-7-2a2 2 0 11-4 0 2 2 0 114m12 0a2 2 0 100-4 2 2 0 100 4"
                  />
                </svg>
                Use My Current Location
              </button>

              <div className="grid grid-cols-3 gap-4 my-4">
                <input
                  type="text"
                  name="pickup_address"
                  value={locationState.pickup_address}
                  onChange={(e) => handleLocationChange(e, "pickup_address")}
                  placeholder="Pickup Address *"
                  maxLength={500}
                  className="w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                  required
                />
                <input
                  type="text"
                  name="pincode"
                  value={locationState.pincode}
                  onChange={(e) => handleLocationChange(e, "pincode")}
                  placeholder="Pincode"
                  className="w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                />
                <input
                  type="text"
                  name="area"
                  value={locationState.area}
                  onChange={(e) => handleLocationChange(e, "area")}
                  placeholder="Area"
                  className="w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                />
                <input
                  type="text"
                  name="state"
                  value={locationState.state}
                  onChange={(e) => handleLocationChange(e, "state")}
                  placeholder="State"
                  className="w-full rounded-lg border-border bg-card p-2 text-sm focus:ring-ring focus:border-ring-shadow-sm transition-colors lg:text-base"
                />
              </div>
              <input
                type="text"
                name="country"
                value={locationState.country}
                readOnly
                className="w-full rounded-lg border-border bg-card/50 p-2 text-sm cursor-not-allowed"
              />

              {/* Status reminder */}
              <p className="mt-2 text-xs text-muted-foreground">
                The pickup deadline must be on or before the expiry time.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all disabled:bg-brand-subtle disabled:pointer-events-none"
          >
            {loading ? "Submitting..." : "Submit Donation"}
          </button>
        </form>
      </div>
    </main>
  );
}