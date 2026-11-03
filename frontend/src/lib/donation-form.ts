/**
 * Pure helpers for the donation form (no imports, so they can be unit-tested without a bundler).
 * Validation mirrors backend/services/donation.service.js and backend/lib/validators.js so people get the
 * server's answer before submitting; the server remains the authority and its field errors are still shown.
 */

export const DONATION_CATEGORIES = [
  "Cooked Meal",
  "Fresh Produce",
  "Non-Perishable",
  "Bakery",
  "Dairy",
  "Snacks",
  "Beverages",
  "Other",
] as const;

export const DONATION_UNITS = ["servings", "kg", "packets", "liters", "boxes"] as const;

export const LIMITS = { title: 200, description: 2000, pickupAddress: 500, area: 120, pincode: 20, state: 120, country: 120, quantityMax: 1_000_000 };

export interface DonationFormValues {
  title: string;
  description: string;
  food_category: string;
  quantity: string;
  unit: string;
  /** datetime-local values: "YYYY-MM-DDTHH:mm", with no time zone */
  prepared_at: string;
  expires_at: string;
  pickup_deadline: string;
  pickup_address: string;
  pincode: string;
  area: string;
  state: string;
  country: string;
}

export const EMPTY_DONATION_FORM: DonationFormValues = {
  title: "",
  description: "",
  food_category: "",
  quantity: "",
  unit: "servings",
  prepared_at: "",
  expires_at: "",
  pickup_deadline: "",
  pickup_address: "",
  pincode: "",
  area: "",
  state: "",
  country: "India",
};

/**
 * An <input type="datetime-local"> yields "2026-10-26T18:30" with NO time zone. Sent as-is, the server parses it in
 * the server's own zone (UTC on most hosts), so a donor in India typing 18:30 would store 18:30 UTC, i.e. 00:00 IST
 * the next day: food shown as safe 5.5 hours longer than they meant. JavaScript reads this form as local time, so
 * converting here pins the instant to the donor's zone before it leaves the browser.
 */
export function localInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Current local time in datetime-local form, for `min` hints on the pickers. */
export function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export type DonationFormErrors = Partial<Record<keyof DonationFormValues, string>>;

export function validateDonation(v: DonationFormValues, now: number): DonationFormErrors {
  const e: DonationFormErrors = {};
  const title = v.title.trim();
  if (!title) e.title = "Give it a short title, for example “Vegetable biryani”.";
  else if (title.length > LIMITS.title) e.title = `Keep the title to ${LIMITS.title} characters or fewer.`;

  if (!(DONATION_CATEGORIES as readonly string[]).includes(v.food_category)) e.food_category = "Choose a category.";

  const quantity = Number(v.quantity);
  if (v.quantity.trim() === "" || !Number.isFinite(quantity) || quantity <= 0) e.quantity = "Enter an amount greater than 0.";
  else if (quantity > LIMITS.quantityMax) e.quantity = "That's more than the limit of 1,000,000.";

  if (!(DONATION_UNITS as readonly string[]).includes(v.unit)) e.unit = "Choose a unit.";
  if (v.description.trim().length > LIMITS.description) e.description = `Keep the description to ${LIMITS.description} characters or fewer.`;

  const expires = localInputToIso(v.expires_at);
  const pickup = localInputToIso(v.pickup_deadline);
  if (!v.expires_at) e.expires_at = "Choose when this food stops being safe to eat.";
  else if (!expires) e.expires_at = "Enter a valid date and time.";
  else if (Date.parse(expires) <= now) e.expires_at = "That time has already passed. Choose a future time.";

  if (!v.pickup_deadline) e.pickup_deadline = "Choose the last time a volunteer can collect it.";
  else if (!pickup) e.pickup_deadline = "Enter a valid date and time.";
  else if (Date.parse(pickup) <= now) e.pickup_deadline = "That time has already passed. Choose a future time.";
  else if (expires && Date.parse(pickup) > Date.parse(expires)) e.pickup_deadline = "Collection has to be no later than the expiry time.";

  if (v.prepared_at && !localInputToIso(v.prepared_at)) e.prepared_at = "Enter a valid date and time.";

  const address = v.pickup_address.trim();
  if (!address) e.pickup_address = "Enter where volunteers should collect it.";
  else if (address.length > LIMITS.pickupAddress) e.pickup_address = `Keep the address to ${LIMITS.pickupAddress} characters or fewer.`;

  for (const [field, max] of [["area", LIMITS.area], ["pincode", LIMITS.pincode], ["state", LIMITS.state], ["country", LIMITS.country]] as const) {
    if (v[field].trim().length > max) e[field] = `Keep this to ${max} characters or fewer.`;
  }
  return e;
}

/** The exact body POSTed to /donations. Times become absolute instants; empty optional fields are omitted. */
export function buildDonationPayload(v: DonationFormValues, coords: { lat: number; lng: number } | null) {
  const optional = (s: string) => s.trim() || undefined;
  return {
    title: v.title.trim(),
    description: optional(v.description),
    food_category: v.food_category,
    quantity: Number(v.quantity),
    unit: v.unit,
    prepared_at: v.prepared_at ? (localInputToIso(v.prepared_at) ?? undefined) : undefined,
    expires_at: localInputToIso(v.expires_at) ?? v.expires_at,
    pickup_deadline: localInputToIso(v.pickup_deadline) ?? v.pickup_deadline,
    pickup_address: v.pickup_address.trim(),
    pincode: optional(v.pincode),
    area: optional(v.area),
    state: optional(v.state),
    country: optional(v.country),
    latitude: coords?.lat,
    longitude: coords?.lng,
  };
}
