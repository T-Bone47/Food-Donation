"use client";

/**
 * One implementation of "use my current location", replacing three copies that used alert() and ignored a denied
 * permission. Failures carry a code and a message that is safe to show as-is.
 */
export type GeoErrorCode = "UNSUPPORTED" | "DENIED" | "UNAVAILABLE" | "TIMEOUT" | "NOT_CONFIGURED" | "LOOKUP_FAILED";

export class GeoError extends Error {
  code: GeoErrorCode;
  constructor(code: GeoErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface PlaceDetails {
  lat: number;
  lng: number;
  road: string;
  /** road, area, city, state, pincode, country: the whole address on one line */
  formatted: string;
  pincode: string;
  area: string;
  state: string;
  country: string;
}

function currentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new GeoError("UNSUPPORTED", "This browser can't share your location. Enter the address by hand."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new GeoError("DENIED", "Location access is blocked. Allow it in your browser, or enter the address by hand."));
        else if (err.code === 3) reject(new GeoError("TIMEOUT", "Finding your location took too long. Try again, or enter the address by hand."));
        else reject(new GeoError("UNAVAILABLE", "We couldn't work out where you are. Enter the address by hand."));
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  });
}

export async function lookupLocation(): Promise<PlaceDetails> {
  const key = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
  if (!key) throw new GeoError("NOT_CONFIGURED", "Automatic location isn't set up here. Enter the address by hand.");
  const { lat, lng } = await currentPosition();
  let components: Record<string, string> | undefined;
  try {
    const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${key}`);
    if (!res.ok) throw new Error(String(res.status));
    components = (await res.json()).results?.[0]?.components;
  } catch {
    throw new GeoError("LOOKUP_FAILED", "We found you but couldn't turn that into an address. Enter it by hand.");
  }
  if (!components) throw new GeoError("LOOKUP_FAILED", "We found you but couldn't turn that into an address. Enter it by hand.");
  const city = components.city || components.town || components.village || "";
  return {
    lat,
    lng,
    formatted: [components.road, components.suburb, city, components.state, components.postcode, components.country].filter(Boolean).join(", "),
    road: components.road || components.suburb || "",
    pincode: components.postcode || "",
    area: components.suburb || components.city || components.town || components.village || "",
    state: components.state || "",
    country: components.country || "India",
  };
}
