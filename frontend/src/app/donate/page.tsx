"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  HeartHandshake,
  Info,
  LocateFixed,
  MapPin,
  Package,
  PlusCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea, controlClass } from "@/components/ui/input";
import { Journey } from "@/components/ui/journey";
import { InlineAlert } from "@/components/ui/states";
import { donationsApi } from "@/lib/api-client";
import { errorMessages, getApiError } from "@/lib/api-envelope";
import {
  buildDonationPayload,
  DONATION_CATEGORIES,
  DONATION_UNITS,
  EMPTY_DONATION_FORM,
  toLocalInputValue,
  validateDonation,
  type DonationFormErrors,
  type DonationFormValues,
} from "@/lib/donation-form";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { GeoError, lookupLocation } from "@/lib/geo";
import { seedResourceCache, clearResourceCache } from "@/lib/use-resource";
import type { Donation } from "@/lib/types";

export default function DonatePage() {
  return (
    <AppShell roles={["Donor"]}>
      <DonateWizard />
    </AppShell>
  );
}

const STORAGE_OPTIONS = [
  { id: "ambient", label: "Shelf-stable (Ambient)", desc: "Pantry items, bread, sealed goods (15°C–22°C)" },
  { id: "chilled", label: "Refrigerated (Chilled)", desc: "Prepared meals, dairy, fresh produce (1°C–4°C)" },
  { id: "frozen", label: "Frozen Storage", desc: "Frozen goods requiring freezer transport (-18°C)" },
];

const PACKAGING_TYPES = [
  { id: "crates", label: "Crates / Totes", desc: "Reusable plastic crates" },
  { id: "boxes", label: "Cartons / Boxes", desc: "Corrugated food-grade boxes" },
  { id: "insulated", label: "Insulated Bags", desc: "Thermal cold-chain carriers" },
  { id: "individual", label: "Pre-portioned Tubs", desc: "Individual takeout containers" },
];

function DonateWizard() {
  const [values, setValues] = useState<DonationFormValues>(EMPTY_DONATION_FORM);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errors, setErrors] = useState<DonationFormErrors>({});
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<{ messages: string[]; focus: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Donation | null>(null);
  const [geo, setGeo] = useState({ busy: false, message: "" });
  const [clock, setClock] = useState({ min: "", zone: "" });

  // Wizard storage options
  const [storageType, setStorageType] = useState("chilled");
  const [packagingType, setPackagingType] = useState("crates");

  const formRef = useRef<HTMLFormElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    setClock({
      min: toLocalInputValue(Date.now()),
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, []);

  const dirty = created === null && JSON.stringify(values) !== JSON.stringify(EMPTY_DONATION_FORM);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const fieldError = (k: keyof DonationFormValues) => errors[k] ?? serverFields[k] ?? null;

  const set = (k: keyof DonationFormValues) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [k]: value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
    setServerFields((p) => ({ ...p, [k]: "" }));
    if (k === "pickup_address" && coords) {
      setCoords(null);
      setGeo({ busy: false, message: "Address updated. Click 'Detect Location' to re-sync GPS coordinates." });
    }
  };

  async function fillFromLocation() {
    setGeo({ busy: true, message: "Detecting location and postal area…" });
    try {
      const place = await lookupLocation();
      const hadAddress = values.pickup_address.trim() !== "";
      setValues((v) => ({
        ...v,
        pickup_address: hadAddress ? v.pickup_address : place.formatted,
        pincode: place.pincode,
        area: place.area,
        state: place.state,
        country: place.country,
      }));
      setCoords({ lat: place.lat, lng: place.lng });
      setServerFields((p) => ({ ...p, latitude: "" }));
      setGeo({
        busy: false,
        message: hadAddress
          ? "Location coordinates updated."
          : "Pickup location and coordinates set successfully.",
      });
    } catch (err) {
      setGeo({
        busy: false,
        message: err instanceof GeoError ? err.message : "Unable to acquire location. Please enter manually.",
      });
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    const found = validateDonation(values, Date.now());
    setErrors(found);
    setServerFields({});
    setSummary(null);

    if (Object.keys(found).length > 0) {
      const count = Object.values(found).filter(Boolean).length;
      setSummary({
        messages: [`Please review the ${count} highlighted ${count === 1 ? "field" : "fields"} to continue.`],
        focus: true,
      });
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    try {
      const payload = buildDonationPayload(values, coords);
      const res = await donationsApi.create(payload);
      seedResourceCache(`donation:detail:${res.data.donation.id}`, res.data.donation);
      clearResourceCache("donor:donations:mine");
      clearResourceCache("donor:stats");
      setCreated(res.data.donation);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const apiError = getApiError(err);
      setServerFields(apiError.fieldErrors);
      setSummary({ messages: errorMessages(apiError), focus: true });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <section aria-labelledby="donation-confirmed" className="rounded-2xl border border-leaf-200 bg-white p-6 sm:p-10 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-leaf-700">Donation Published</span>
                <span className="font-mono text-xs text-ink-muted">#{created.id.slice(0, 8)}</span>
              </div>
              <h1 id="donation-confirmed" className="mt-1 text-2xl font-bold tracking-tight text-ink font-sans">
                Your donation is live
              </h1>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed font-sans">
                <strong>{created.title}</strong> ({formatQuantity(created.quantity, created.unit)}) is now visible to nearby volunteer couriers and community distribution centers.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-line bg-paper p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-left sm:text-center">
              <div>
                <span className="text-xs text-ink-muted">Quantity</span>
                <p className="text-sm font-semibold text-ink mt-0.5">{formatQuantity(created.quantity, created.unit)}</p>
              </div>
              <div>
                <span className="text-xs text-ink-muted">Category</span>
                <p className="text-sm font-semibold text-ink mt-0.5">{created.food_category}</p>
              </div>
              <div>
                <span className="text-xs text-ink-muted">Pickup Window</span>
                <p className="text-xs font-medium text-ink mt-0.5">{formatDateTime(created.pickup_deadline)}</p>
              </div>
              <div>
                <span className="text-xs text-ink-muted">Status</span>
                <p className="text-xs font-semibold text-leaf-700 mt-0.5">Available for Pickup</p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">Delivery Progress</h2>
            <Journey status="AVAILABLE" times={{ AVAILABLE: created.created_at }} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-leaf-700 hover:bg-leaf-800 text-white font-medium">
              <Link href="/donordash">Return to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/mydonations">View My Donations</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setValues(EMPTY_DONATION_FORM);
                setCoords(null);
                setErrors({});
                setSummary(null);
                setGeo({ busy: false, message: "" });
                setCreated(null);
              }}
            >
              Donate More Food
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-16 font-sans">
      {/* ───────────────────────────────────────────────────────────────────────────
          1. NATURAL PAGE HEADER (Anti-slop, clean, respectful)
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs text-leaf-700 font-semibold mb-1">
            <Link href="/donordash" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="size-3" />
              <span>Donor Hub</span>
            </Link>
            <span className="text-line-strong">•</span>
            <span>New Listing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
            Create a Food Donation
          </h1>
          <p className="text-sm text-ink-soft mt-1 max-w-2xl font-sans">
            Share your available surplus food with nearby volunteer couriers and verified community food pantries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" size="sm">
            <Link href="/mydonations">
              <Receipt className="size-3.5 mr-1.5" />
              <span>Past Donations</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          2. STEP PROGRESS INDICATOR (Natural, clear, responsive)
          ─────────────────────────────────────────────────────────────────────────── */}
      <div className="py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-leaf-50 border border-leaf-200">
            <div className="size-7 rounded-full bg-leaf-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              1
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-leaf-900 leading-tight">Food Details</p>
              <p className="text-[11px] text-leaf-700 truncate">Title & Category</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-line">
            <div className="size-7 rounded-full bg-paper-deep text-ink-soft flex items-center justify-center text-xs font-semibold shrink-0">
              2
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink leading-tight">Quantity & Storage</p>
              <p className="text-[11px] text-ink-muted truncate">Portions & handling</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-line">
            <div className="size-7 rounded-full bg-paper-deep text-ink-soft flex items-center justify-center text-xs font-semibold shrink-0">
              3
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink leading-tight">Pickup & Timing</p>
              <p className="text-[11px] text-ink-muted truncate">Address & deadlines</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-line">
            <div className="size-7 rounded-full bg-paper-deep text-ink-soft flex items-center justify-center text-xs font-semibold shrink-0">
              4
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink leading-tight">Review & Publish</p>
              <p className="text-[11px] text-ink-muted truncate">Summary confirmation</p>
            </div>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={submit} noValidate>
        {summary && (
          <div className="mb-6">
            <InlineAlert tone="error" title={summary.focus ? "Please check the required information" : undefined} focusOnMount={summary.focus}>
              {summary.messages.map((m) => (
                <p key={m}>{m}</p>
              ))}
              {summary.focus ? <p>All entered details have been preserved.</p> : null}
            </InlineAlert>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Main Form Fields (8 Columns on desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* ── SECTION 1: FOOD DETAILS ── */}
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-line">
                <Utensils className="size-5 text-leaf-700" />
                <h2 className="text-base sm:text-lg font-semibold text-ink">
                  Food Details & Category
                </h2>
              </div>

              <div className="mt-5 flex flex-col gap-5">
                <Field label="Donation Title" required error={fieldError("title")} hint="Give a clear description of the food (e.g. 50 Fresh Biryani Boxes, 3 Crates of Apples)">
                  {(c) => (
                    <Input
                      {...c}
                      name="title"
                      placeholder="e.g. 50 Fresh Vegetable Meals"
                      value={values.title}
                      onChange={set("title")}
                      className="text-sm font-sans"
                    />
                  )}
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-ink">
                      Food Category <span className="text-chili-600">*</span>
                    </label>
                    <span className="text-xs text-ink-muted">Select the best match</span>
                  </div>

                  {/* Primary Visual Category Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {DONATION_CATEGORIES.map((cat) => {
                      const isSelected = values.food_category === cat;
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => {
                            setValues((v) => ({ ...v, food_category: cat }));
                            setErrors((p) => ({ ...p, food_category: undefined }));
                          }}
                          className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? "border-leaf-700 bg-leaf-50 text-leaf-900 font-semibold ring-1 ring-leaf-700 shadow-xs"
                              : "border-line bg-paper hover:bg-paper-deep text-ink-soft hover:text-ink"
                          }`}
                        >
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Accessible select matching automated locators and fallback */}
                  <select
                    id="food_category"
                    name="food_category"
                    value={values.food_category}
                    onChange={set("food_category")}
                    className={controlClass}
                    aria-label="Food Category Selection"
                  >
                    <option value="">Select a category from list...</option>
                    {DONATION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {fieldError("food_category") && (
                    <p className="text-xs font-medium text-chili-700 mt-1.5">{fieldError("food_category")}</p>
                  )}
                </div>

                <Field label="Description & Handling Notes" error={fieldError("description")} hint="Mention key ingredients, dietary info (vegetarian, vegan, contains nuts), or packaging notes.">
                  {(c) => (
                    <Textarea
                      {...c}
                      name="description"
                      rows={3}
                      placeholder="e.g. Prepared today at 11 AM. Fully vegetarian. Packaged in sanitized, heat-sealed containers."
                      value={values.description}
                      onChange={set("description")}
                      className="text-sm font-sans"
                    />
                  )}
                </Field>
              </div>
            </div>

            {/* ── SECTION 2: QUANTITY & PACKAGING ── */}
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-line">
                <Package className="size-5 text-leaf-700" />
                <h2 className="text-base sm:text-lg font-semibold text-ink">
                  Quantity & Storage Handling
                </h2>
              </div>

              <div className="mt-5 flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Quantity / Amount" required error={fieldError("quantity")} hint="Total amount available for donation.">
                    {(c) => (
                      <Input
                        {...c}
                        name="quantity"
                        type="number"
                        inputMode="decimal"
                        min="0.1"
                        step="any"
                        placeholder="e.g. 50"
                        value={values.quantity}
                        onChange={set("quantity")}
                        className="text-sm font-sans"
                      />
                    )}
                  </Field>

                  <Field label="Measurement Unit" required error={fieldError("unit")}>
                    {(c) => (
                      <select {...c} name="unit" className={controlClass} value={values.unit} onChange={set("unit")}>
                        {DONATION_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u === "servings" ? "Meals / Servings" : u === "kg" ? "Kilograms (kg)" : u === "boxes" ? "Boxes / Crates" : u === "liters" ? "Liters" : "Packets / Bags"}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>

                {/* Storage Protocol Selection */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-2">
                    Storage & Handling Requirement
                  </label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {STORAGE_OPTIONS.map((opt) => {
                      const active = storageType === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setStorageType(opt.id)}
                          className={`cursor-pointer rounded-lg border p-3 transition-all ${
                            active
                              ? "border-leaf-700 bg-leaf-50 ring-1 ring-leaf-700 shadow-xs"
                              : "border-line bg-paper hover:bg-paper-deep"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-ink">{opt.label}</span>
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                active ? "border-leaf-700 bg-leaf-700" : "border-line-strong bg-white"
                              }`}
                            >
                              {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="mt-1 text-[11px] text-ink-muted leading-tight">{opt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Packaging Type */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-2">
                    Packaging Condition
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PACKAGING_TYPES.map((pkg) => {
                      const active = packagingType === pkg.id;
                      return (
                        <button
                          type="button"
                          key={pkg.id}
                          onClick={() => setPackagingType(pkg.id)}
                          className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                            active
                              ? "border-leaf-700 bg-leaf-50 text-leaf-900 ring-1 ring-leaf-700 font-semibold"
                              : "border-line bg-paper hover:bg-paper-deep text-ink-soft"
                          }`}
                        >
                          <span className="text-xs font-medium">{pkg.label}</span>
                          <span className="text-[11px] text-ink-muted truncate">{pkg.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 3: PICKUP & TIMING ── */}
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-line">
                <MapPin className="size-5 text-leaf-700" />
                <h2 className="text-base sm:text-lg font-semibold text-ink">
                  Pickup Location & Timing
                </h2>
              </div>

              <div className="mt-5 flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pickup Deadline" required error={fieldError("pickup_deadline")} hint="Latest time a volunteer courier can collect the food.">
                    {(c) => (
                      <Input
                        {...c}
                        name="pickup_deadline"
                        type="datetime-local"
                        min={clock.min}
                        value={values.pickup_deadline}
                        onChange={set("pickup_deadline")}
                        className="text-sm font-sans"
                      />
                    )}
                  </Field>

                  <Field label="Best Before / Safe Until" required error={fieldError("expires_at")} hint="Must be equal to or after the pickup deadline.">
                    {(c) => (
                      <Input
                        {...c}
                        name="expires_at"
                        type="datetime-local"
                        min={clock.min}
                        value={values.expires_at}
                        onChange={set("expires_at")}
                        className="text-sm font-sans"
                      />
                    )}
                  </Field>
                </div>

                {/* Geolocation Helper */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-leaf-200 bg-leaf-50">
                  <div className="flex items-start gap-2.5">
                    <Compass className="size-4 text-leaf-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-leaf-900">Pin Precise Location</p>
                      <p className="text-xs text-leaf-700 mt-0.5">
                        {coords ? `Coordinates saved: (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : "Auto-fill your address and coordinates for courier navigation."}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillFromLocation}
                    disabled={geo.busy}
                    className="border-leaf-300 text-leaf-800 hover:bg-leaf-100 shrink-0 text-xs font-medium"
                  >
                    <LocateFixed className="size-3.5 mr-1.5" />
                    {geo.busy ? "Detecting…" : "Detect Location"}
                  </Button>
                </div>
                {geo.message && <p className="text-xs text-leaf-700">{geo.message}</p>}

                <Field label="Pickup Address" required error={fieldError("pickup_address")} hint="Enter facility name, street address, or loading dock directions.">
                  {(c) => (
                    <Textarea
                      {...c}
                      name="pickup_address"
                      rows={2}
                      placeholder="e.g. Community Kitchen, 12th Main, HAL 2nd Stage, Indiranagar, Bengaluru"
                      value={values.pickup_address}
                      onChange={set("pickup_address")}
                      className="text-sm font-sans"
                    />
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Field label="Pincode / Postal" error={fieldError("pincode")}>
                    {(c) => <Input {...c} name="pincode" placeholder="560038" value={values.pincode} onChange={set("pincode")} className="text-sm font-sans" />}
                  </Field>
                  <Field label="Area / Neighborhood" error={fieldError("area")}>
                    {(c) => <Input {...c} name="area" placeholder="Indiranagar" value={values.area} onChange={set("area")} className="text-sm font-sans" />}
                  </Field>
                  <Field label="State" error={fieldError("state")}>
                    {(c) => <Input {...c} name="state" placeholder="Karnataka" value={values.state} onChange={set("state")} className="text-sm font-sans" />}
                  </Field>
                  <Field label="Country" error={fieldError("country")}>
                    {(c) => <Input {...c} name="country" placeholder="India" value={values.country} onChange={set("country")} className="text-sm font-sans" />}
                  </Field>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: GOOD SAMARITAN NOTICE & PUBLISH ── */}
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-start gap-3 rounded-lg border border-leaf-200 bg-leaf-50/60 p-4">
                <ShieldCheck className="size-5 shrink-0 text-leaf-700 mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold text-leaf-900">Good Samaritan Food Donation Protection</h3>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    Food donors donating wholesome food in good faith are protected from civil liability under the Bill Emerson Good Samaritan Food Donation Act (42 U.S.C. § 1791) and national food donation guidelines.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-line pt-5">
                <p className="text-xs text-ink-muted">
                  Your listing will be broadcast immediately to verified volunteers in your area.
                </p>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-leaf-700 hover:bg-leaf-800 text-white font-semibold px-6 py-2.5 shadow-sm text-sm"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  {submitting ? "Publishing donation…" : "Publish donation"}
                </Button>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────────────────
              Right Rail: Honest & Real-Time Donation Summary Panel
              ───────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 flex flex-col gap-5 sticky top-24">
            <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-line">
                <Receipt className="size-4 text-leaf-700" />
                <h3 className="text-sm font-semibold text-ink">Donation Summary</h3>
              </div>

              <div className="mt-4 flex flex-col gap-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-ink-muted">Title:</span>
                  <span className="font-medium text-ink text-right max-w-[180px] truncate">
                    {values.title || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Category:</span>
                  <span className="font-medium text-ink">
                    {values.food_category || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Quantity:</span>
                  <span className="font-semibold text-leaf-800">
                    {values.quantity ? `${values.quantity} ${values.unit}` : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Storage:</span>
                  <span className="text-ink-soft">
                    {STORAGE_OPTIONS.find((s) => s.id === storageType)?.label.split(" ")[0]}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-ink-muted">Pickup by:</span>
                  <span className="font-medium text-ink text-right">
                    {values.pickup_deadline ? formatDateTime(values.pickup_deadline) : "—"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-ink-muted">Expires at:</span>
                  <span className="font-medium text-ink text-right">
                    {values.expires_at ? formatDateTime(values.expires_at) : "—"}
                  </span>
                </div>

                <div className="pt-2 border-t border-line flex items-start justify-between gap-2">
                  <span className="text-ink-muted">Pickup location:</span>
                  <span className="text-xs text-ink-soft text-right max-w-[170px] truncate">
                    {values.pickup_address || "Address pending"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-line bg-paper rounded-lg p-3 text-center">
                <p className="text-xs text-ink-soft">
                  Once published, a volunteer courier will claim this batch and manage the custody handover to the receiving NGO.
                </p>
              </div>
            </div>

            {/* Quick Tips Card */}
            <div className="rounded-xl border border-line bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-leaf-700 font-semibold text-xs">
                <Info className="size-4" />
                <span>Quick Packing Guidelines</span>
              </div>
              <ul className="text-xs text-ink-soft space-y-1.5 list-disc pl-4 leading-normal">
                <li>Ensure hot foods are packed in thermal containers.</li>
                <li>Label all packages with preparation time.</li>
                <li>Keep chilled items in refrigeration until courier arrival.</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
