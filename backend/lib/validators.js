export const ALLOWED_SIGNUP_ROLES = ["Donor", "Volunteer", "NGO"];

export const DONATION_CATEGORIES = [
  "Cooked Meal",
  "Fresh Produce",
  "Non-Perishable",
  "Bakery",
  "Dairy",
  "Snacks",
  "Beverages",
  "Other",
];

export const DONATION_UNITS = ["servings", "kg", "packets", "liters", "boxes"];

export const LIMITS = {
  name: 150,
  title: 200,
  description: 2000,
  pickupAddress: 500,
  email: 254,
  organization: 200,
  phone: 30,
  area: 120,
  pincode: 20,
  state: 120,
  country: 120,
  passwordMax: 72, // bcrypt truncates beyond 72 bytes
  quantityMax: 1_000_000,
};

export function isValidPhone(phone) {
  if (phone === null || phone === undefined || phone === "") return true;
  if (typeof phone !== "string") return false;
  const value = phone.trim();
  if (value.length === 0) return true;
  if (value.length > LIMITS.phone || value.length < 5) return false;
  return /^[+]?[0-9\s\-()]{5,30}$/.test(value);
}

export function isValidPincode(pincode) {
  if (pincode === null || pincode === undefined || pincode === "") return true;
  if (typeof pincode !== "string") return false;
  const value = pincode.trim();
  if (value.length === 0) return true;
  if (value.length > LIMITS.pincode || value.length < 3) return false;
  return /^[a-zA-Z0-9\s\-]{3,20}$/.test(value);
}

export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const value = email.trim();
  if (value.length === 0 || value.length > LIMITS.email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function isValidPassword(password) {
  if (typeof password !== "string") return false;
  // Minimum length only; complexity policy is intentionally minimal for MVP.
  // The upper bound prevents bcrypt silently truncating long passwords.
  return password.length >= 6 && password.length <= LIMITS.passwordMax;
}

export function isValidQuantity(quantity) {
  const value = Number(quantity);
  return (
    Number.isFinite(value) && value > 0 && value <= LIMITS.quantityMax
  );
}

/**
 * Optional text field length guard. Returns true for null/undefined.
 */
export function isWithinLength(value, max) {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string") return false;
  return value.trim().length <= max;
}

export function isNonEmptyText(value, max = 500) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= max
  );
}

export function isValidUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function parseCoordinates(latitude, longitude) {
  const hasLat = latitude !== undefined && latitude !== null && latitude !== "";
  const hasLng =
    longitude !== undefined && longitude !== null && longitude !== "";

  if (!hasLat && !hasLng) return { lat: null, lng: null, valid: true };
  if (hasLat !== hasLng) return { lat: null, lng: null, valid: false };

  const lat = Number(latitude);
  const lng = Number(longitude);
  const valid =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  return valid ? { lat, lng, valid: true } : { lat: null, lng: null, valid: false };
}

/**
 * Food expiry must be a valid future timestamp.
 */
export function isValidExpiry(expiry) {
  if (typeof expiry !== "string" || !expiry.trim()) return false;
  const date = new Date(expiry);
  if (Number.isNaN(date.getTime())) return false;
  if (date.getTime() <= Date.now()) return false;
  return true;
}

/**
 * Pickup deadline must be a valid future timestamp and no later than expiry:
 * food cannot be collected after it has expired.
 */
export function isValidPickupDeadline(expiry, pickupDeadline) {
  if (!isValidExpiry(expiry)) return false;
  if (typeof pickupDeadline !== "string" || !pickupDeadline.trim()) {
    return false;
  }
  const pickup = new Date(pickupDeadline);
  const expires = new Date(expiry);
  if (Number.isNaN(pickup.getTime()) || Number.isNaN(expires.getTime())) {
    return false;
  }
  if (pickup.getTime() > expires.getTime()) return false;
  if (pickup.getTime() <= Date.now()) return false;
  return true;
}

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  const map = {
    donor: "Donor",
    volunteer: "Volunteer",
    ngo: "NGO",
    admin: "Admin",
  };
  return map[value] || null;
}
