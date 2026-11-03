"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Flame,
  Gavel,
  Globe,
  HandHeart,
  KeyRound,
  Leaf,
  LocateFixed,
  Lock,
  Package,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Truck,
  type LucideIcon,
} from "lucide-react";

import DemoRoleSelectorModal from "@/components/demo/DemoRoleSelectorModal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { InlineAlert } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { authApi } from "@/lib/api-client";
import { getApiError, type ApiError } from "@/lib/api-envelope";
import { validateSignup, type Errors, type SignupValues } from "@/lib/auth-form";
import { GeoError, lookupLocation } from "@/lib/geo";

type RoleValue = "Donor" | "Volunteer" | "NGO";

const ROLES: { value: RoleValue; title: string; text: string; icon: LucideIcon }[] = [
  { value: "Donor", title: "Surplus Food Donor", text: "Commercial kitchens, grocers, and caterers staging surplus.", icon: HandHeart },
  { value: "Volunteer", title: "Field Rescue Courier", text: "Claim pickups and provide chain-of-custody delivery.", icon: Truck },
  { value: "NGO", title: "Verified Recipient Hub", text: "Food pantries & community shelters receiving inspected cargo.", icon: Building2 },
];

const EMPTY_SIGNUP: SignupValues = {
  name: "",
  organization: "",
  email: "",
  phonenumber: "",
  password: "",
  pincode: "",
  area: "",
  state: "",
  country: "India",
};

export default function FoodSharePublicLandingPage() {
  const router = useRouter();
  const toast = useToast();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Registration State
  const [role, setRole] = useState<RoleValue | null>(null);
  const [values, setValues] = useState<SignupValues>(EMPTY_SIGNUP);
  const [errors, setErrors] = useState<Errors<keyof SignupValues>>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const [geo, setGeo] = useState<{ busy: boolean; message: string }>({ busy: false, message: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (role) {
      (formRef.current?.elements.namedItem("name") as HTMLElement | null)?.focus();
    }
  }, [role]);

  const setVal = (field: keyof SignupValues) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const fieldError = (field: keyof SignupValues) => errors[field] ?? serverError?.fieldErrors[field] ?? null;

  async function fillFromLocation() {
    setGeo({ busy: true, message: "Acquiring coordinates…" });
    try {
      const place = await lookupLocation();
      setValues((v) => ({ ...v, pincode: place.pincode, area: place.area, state: place.state, country: place.country }));
      setGeo({ busy: false, message: "Geotag confirmed. You can adjust fields manually if required." });
    } catch (err) {
      setGeo({ busy: false, message: err instanceof GeoError ? err.message : "Location lookup failed. Please enter manually." });
    }
  }

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || !role) return;
    const found = validateSignup(values);
    setErrors(found);
    setServerError(null);
    const first = (Object.keys(found) as (keyof SignupValues)[])[0];
    if (first) {
      (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.signup({
        name: values.name.trim(),
        email: values.email.trim(),
        organization: values.organization.trim(),
        password: values.password,
        phonenumber: values.phonenumber.trim(),
        role,
        pincode: values.pincode.trim(),
        area: values.area.trim(),
        state: values.state.trim(),
        country: values.country.trim(),
      });
      const { user, token } = res.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      toast.show("Account registered successfully. Signing in…");
      router.push("/login");
    } catch (err) {
      setServerError(getApiError(err));
      toast.show("Unable to complete registration. Check highlighted fields.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-[#0B1C30] font-sans antialiased selection:bg-[#B0F1C7]">
      {/* ───────────────────────────────────────────────────────────────────────────
          1. TOP TELEMETRY TICKER (Stitch Command Ribbon)
          ─────────────────────────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#EFF4FF] border-b border-[#CBD5E1]/60 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#404942]">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#B0F1C7] text-[#002111] font-bold">
              <span className="size-1.5 rounded-full bg-[#0F5132] animate-pulse" />
              NETWORK LIVE
            </span>
            <span className="hidden sm:inline">DISPATCH CLUSTER: HYPER-LOCAL</span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-[#0B1C30] font-semibold">SYS LATENCY: &lt; 20ms</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-[#404942] font-medium">
            <div className="flex items-center gap-1.5">
              <Leaf className="size-3.5 text-[#005137]" />
              <span className="font-semibold text-[#0B1C30]">42,850+ KG</span>
              <span className="hidden md:inline">DIVERTED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="size-3.5 text-[#0F5132]" />
              <span className="font-semibold text-[#0B1C30]">120,000+</span>
              <span className="hidden md:inline">MEALS STAGED</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#0F5132]" />
              <span>100% VERIFIED NGOS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          2. STITCH BRAND HEADER
          ─────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-lg">
            <span className="grid size-9 place-items-center rounded-lg bg-[#0F5132] text-white shadow-xs">
              <Flame className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-[#0B1C30] leading-tight">
                FoodShare
              </span>
              <span className="text-[10px] text-[#0F5132] font-semibold tracking-wide">
                Community Food Rescue
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#404942]">
            <a href="#lifecycle" className="hover:text-[#0F5132] transition-colors">
              How It Works
            </a>
            <a href="#ecosystem" className="hover:text-[#0F5132] transition-colors">
              Community Roles
            </a>
            <a href="#trust" className="hover:text-[#0F5132] transition-colors">
              Food Safety
            </a>
            <a href="#register" className="hover:text-[#0F5132] transition-colors">
              Get Started
            </a>
          </nav>

          {/* Quick Action Cluster */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDemoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B0F1C7] text-[#002111] hover:bg-[#95D4AC] text-xs font-bold transition-colors shadow-xs"
            >
              <Sparkles className="size-3.5 text-[#0F5132]" />
              <span>Launch Demo Mode</span>
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] hover:bg-[#EFF4FF] text-xs font-semibold text-[#0B1C30] transition-colors shadow-xs"
            >
              <KeyRound className="size-3.5 text-[#404942]" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────────
          3. HERO & REAL-TIME DISPATCH HUD
          ─────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Headline & CTAs (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded bg-[#ECFDF5] text-[#065F46] text-xs font-semibold border border-leaf-200">
              <Radio className="size-3.5 text-[#0F5132]" />
              <span>Community Food Rescue Platform</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1C30] leading-[1.12]">
              The Operating System for Zero-Waste Food Rescue.
            </h1>

            <p className="text-base sm:text-lg text-[#404942] leading-relaxed max-w-2xl">
              Connecting commercial food donors, certified volunteer couriers, and verified hunger-relief hubs through deterministic custody verification, temperature monitoring, and automated compliance.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0F5132] text-white hover:bg-[#0A3D2A] text-sm font-semibold transition-all shadow-md group"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] hover:bg-[#EFF4FF] text-sm font-semibold text-[#0B1C30] transition-colors shadow-xs"
              >
                <span>Access Console</span>
              </Link>

              <a
                href="#register"
                className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-[#0F5132] hover:underline"
              >
                <span>Create New Account</span>
                <ArrowRight className="size-3.5" />
              </a>
            </div>

            {/* Real-time Telemetry Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E2E8F0]/80">
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs">
                <span className="font-mono text-[10px] text-[#707971] block uppercase tracking-wider">Avg Route Dispatch</span>
                <span className="text-xl sm:text-2xl font-bold text-[#0B1C30] font-mono">18.4m</span>
                <span className="text-[11px] font-mono text-[#0F5132] block mt-0.5">Automated Match</span>
              </div>
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs">
                <span className="font-mono text-[10px] text-[#707971] block uppercase tracking-wider">Safe Handover</span>
                <span className="text-xl sm:text-2xl font-bold text-[#0F5132] font-mono">100%</span>
                <span className="text-[11px] font-mono text-[#404942] block mt-0.5">Dual Confirmed</span>
              </div>
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs">
                <span className="font-mono text-[10px] text-[#707971] block uppercase tracking-wider">IRS 170(e)(3)</span>
                <span className="text-xl sm:text-2xl font-bold text-[#005137] font-mono">AUDITED</span>
                <span className="text-[11px] font-mono text-[#404942] block mt-0.5">Good Samaritan</span>
              </div>
            </div>
          </div>

          {/* Real-Time Dispatch HUD Card (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="p-5 sm:p-6 rounded-xl bg-[#FFFFFF] border border-[#CBD5E1] shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#10B981] animate-ping" />
                  <span className="font-mono text-xs font-bold text-[#0B1C30]">ACTIVE MISSION #RC-8924</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#EEF2FF] text-[#3730A3] font-bold uppercase">
                  IN TRANSIT
                </span>
              </div>

              {/* Manifest Metadata */}
              <div className="bg-[#EFF4FF] p-3 rounded-lg flex flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between items-center text-[#404942]">
                  <span>MANIFEST SOURCE</span>
                  <span className="text-[#0B1C30] font-semibold">Community Kitchen Demo</span>
                </div>
                <div className="flex justify-between items-center text-[#404942]">
                  <span>RECEIVING HUB</span>
                  <span className="text-[#0B1C30] font-semibold">Hope Shelter Foundation</span>
                </div>
                <div className="flex justify-between items-center text-[#404942]">
                  <span>CARGO PAYLOAD</span>
                  <span className="text-[#0B1C30] font-semibold">50 Servings (Cooked Meals)</span>
                </div>
              </div>

              {/* Ambient Sensors HUD */}
              <div className="bg-[#213145] text-white p-3 rounded-lg flex items-center justify-between font-mono text-xs">
                <div className="flex flex-col">
                  <span className="text-[#68FCBF] text-[10px] uppercase">Temperature Integrity</span>
                  <span className="font-bold text-sm text-white flex items-center gap-1 mt-0.5">
                    <Thermometer className="size-3.5 text-[#68FCBF]" />
                    3.4°C [NOMINAL]
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[#68FCBF] text-[10px] uppercase">ETA Destination</span>
                  <span className="font-bold text-sm text-white flex items-center gap-1 mt-0.5 justify-end">
                    <Clock className="size-3.5 text-[#68FCBF]" />
                    14 mins (1.8 km)
                  </span>
                </div>
              </div>

              {/* Chain of Custody Progress */}
              <div className="flex items-center justify-between text-xs pt-1 text-[#404942]">
                <span className="font-medium">Assigned Courier: Demo Volunteer</span>
                <span className="text-[#0F5132] font-semibold font-mono">Stage 3 of 5 Complete</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          4. 5-STAGE CIRCULAR RESCUE LIFECYCLE (Stitch Pipeline)
          ─────────────────────────────────────────────────────────────────────────── */}
      <section id="lifecycle" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#0F5132] font-bold">Standard Operating Protocol</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1C30] mt-1">
                5-Stage Deterministic Custody Lifecycle
              </h2>
            </div>
            <p className="text-sm text-[#404942] max-w-md">
              Zero ambiguity from harvest surplus to recipient staging. Each state transition enforces dual verification, volunteer attribution, and audit persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Stage 1 */}
            <div className="p-4 rounded-xl bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#D3E4FE] text-[#0B1C30]">01. STAGED</span>
                  <Package className="size-4 text-[#0F5132]" />
                </div>
                <h3 className="font-mono font-bold text-[#065F46] text-sm mt-2">AVAILABLE</h3>
                <p className="text-xs text-[#404942] leading-relaxed">
                  Donor lists surplus batch with quantity, category, packaging, and pickup deadline.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#CBD5E1]/60 font-mono text-[10px] text-[#707971]">
                Status: Staged & Broadcast
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-xl bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#DAE2FD] text-[#131B2E]">02. ROUTED</span>
                  <Search className="size-4 text-[#6366F1]" />
                </div>
                <h3 className="font-mono font-bold text-[#3730A3] text-sm mt-2">ASSIGNED</h3>
                <p className="text-xs text-[#404942] leading-relaxed">
                  Field volunteer discovers and claims batch; mutual routing locks task concurrency.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#CBD5E1]/60 font-mono text-[10px] text-[#707971]">
                Atomic RPC: claim_donation
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-xl bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">03. TRANSIT</span>
                  <Truck className="size-4 text-[#F59E0B]" />
                </div>
                <h3 className="font-mono font-bold text-[#92400E] text-sm mt-2">PICKED_UP</h3>
                <p className="text-xs text-[#404942] leading-relaxed">
                  Courier collects cargo from donor staging dock; custody transfer logged to ledger.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#CBD5E1]/60 font-mono text-[10px] text-[#707971]">
                Cold-Chain: En Route
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-xl bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0369A1]">04. DOCKED</span>
                  <LocateFixed className="size-4 text-[#0EA5E9]" />
                </div>
                <h3 className="font-mono font-bold text-[#0369A1] text-sm mt-2">DELIVERED</h3>
                <p className="text-xs text-[#404942] leading-relaxed">
                  Arrives at verified NGO intake door; supervisor initiates intake check.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#CBD5E1]/60 font-mono text-[10px] text-[#707971]">
                Dock Inspection Ready
              </div>
            </div>

            {/* Stage 5 */}
            <div className="p-4 rounded-xl bg-[#0F5132] text-white border border-[#0A3D2A] flex flex-col justify-between shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#B0F1C7] text-[#002111]">05. AUDITED</span>
                  <CheckCircle2 className="size-4 text-[#68FCBF]" />
                </div>
                <h3 className="font-mono font-bold text-white text-sm mt-2">COMPLETED</h3>
                <p className="text-xs text-[#E5EEFF] leading-relaxed">
                  NGO confirms weight and freshness; tax slip vaulted and impact metrics synced.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/20 font-mono text-[10px] text-[#95D4AC]">
                Dual Sign-Off Sealed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          5. ROLE-AWARE MODULE ECOSYSTEM
          ─────────────────────────────────────────────────────────────────────────── */}
      <section id="ecosystem" className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#0F5132] font-bold">Platform Stakeholders</span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1C30] mt-1">
              Purpose-Built Consoles for Every Role
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Donor */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                <div className="size-10 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#0F5132]">
                  <HandHeart className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1C30]">Food Donors</h3>
                <p className="text-xs text-[#404942] leading-relaxed">
                  Hotels, restaurants, supermarkets, and caterers. Schema-aligned batch creation, pickup scheduling, and donation receipts.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#E2E8F0]">
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#0F5132] hover:underline flex items-center gap-1"
                >
                  <span>Open Donor Hub</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Volunteer */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                <div className="size-10 rounded-lg bg-[#DAE2FD] flex items-center justify-center text-[#565E74]">
                  <Truck className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1C30]">Volunteer Fleets</h3>
                <p className="text-xs text-[#404942] leading-relaxed">
                  Community couriers and transport volunteers. Real-time pickup discovery, turn-by-turn guidance, and handover verification.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#E2E8F0]">
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#0F5132] hover:underline flex items-center gap-1"
                >
                  <span>Volunteer Dispatch</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* NGO */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                <div className="size-10 rounded-lg bg-[#B0F1C7] flex items-center justify-center text-[#003820]">
                  <Building2 className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1C30]">Verified NGOs</h3>
                <p className="text-xs text-[#404942] leading-relaxed">
                  Food banks, soup kitchens, and distribution shelters. Inbound cargo manifests, quality inspections, and receipt sign-off.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#E2E8F0]">
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#0F5132] hover:underline flex items-center gap-1"
                >
                  <span>NGO Intake Hub</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Admin */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3">
                <div className="size-10 rounded-lg bg-[#D3E4FE] flex items-center justify-center text-[#0F5132]">
                  <ShieldCheck className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1C30]">Command Center</h3>
                <p className="text-xs text-[#404942] leading-relaxed">
                  Platform administrators and coordinators. Real-time donation tracking, user account governance, NGO vetting, and audit logs.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-[#E2E8F0]">
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#0F5132] hover:underline flex items-center gap-1"
                >
                  <span>Admin Console</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          6. FIELD TRUST & REGULATORY COMPLIANCE
          ─────────────────────────────────────────────────────────────────────────── */}
      <section id="trust" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#EFF4FF] border-b border-[#CBD5E1]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-[#0F5132]" />
              <h3 className="font-bold text-sm text-[#0B1C30]">Supabase Cryptographic Isolation</h3>
            </div>
            <p className="text-xs text-[#404942] leading-relaxed">
              Strict multi-tenant Row-Level Security (RLS) policies guarantee private organization manifests are accessible only to verified, authorized roles.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Gavel className="size-5 text-[#0F5132]" />
              <h3 className="font-bold text-sm text-[#0B1C30]">Good Samaritan Protection</h3>
            </div>
            <p className="text-xs text-[#404942] leading-relaxed">
              Standard operating procedures designed around the Bill Emerson Good Samaritan Food Donation Act, protecting food donors acting in good faith.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-[#0F5132]" />
              <h3 className="font-bold text-sm text-[#0B1C30]">Environmental Accounting</h3>
            </div>
            <p className="text-xs text-[#404942] leading-relaxed">
              Automatic GHG and landfill diversion calculation aligned with the EPA WARM standard, issuing verifiable sustainability receipts upon handover.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          7. REGISTER ACCOUNT WORKFLOW (Preserved Functional Engine)
          ─────────────────────────────────────────────────────────────────────────── */}
      <section id="register" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF]">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#0F5132] font-bold">Onboard Platform</span>
            <h2 className="text-3xl font-display font-bold text-[#0B1C30]">Create Your FoodShare Account</h2>
            <p className="text-sm text-[#404942]">Select your operating role to begin rescuing or receiving surplus food.</p>
          </div>

          {/* Role Selection Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ROLES.map((r) => {
              const selected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${selected
                      ? "border-[#0F5132] bg-[#ECFDF5] shadow-xs ring-2 ring-[#0F5132]/30"
                      : "border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#F8F9FF]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <r.icon className={`size-5 ${selected ? "text-[#0F5132]" : "text-[#707971]"}`} />
                    {selected && <CheckCircle2 className="size-4 text-[#0F5132]" />}
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold text-sm text-[#0B1C30]">{r.title}</h4>
                    <p className="text-xs text-[#404942] mt-1 leading-snug">{r.text}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Registration Form when role is chosen */}
          {role && (
            <div className="p-6 sm:p-8 rounded-xl bg-[#F8F9FF] border border-[#CBD5E1] shadow-sm">
              <form ref={formRef} onSubmit={handleSignup} noValidate className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="text-xs font-bold font-mono text-[#0F5132] uppercase">
                    Registering as: {role}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRole(null)}
                    className="text-xs text-[#707971] hover:underline"
                  >
                    Change Role
                  </button>
                </div>

                {serverError && (
                  <InlineAlert tone="error" title={serverError.message} />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" required error={fieldError("name")}>
                    {(control) => (
                      <Input
                        {...control}
                        name="name"
                        value={values.name}
                        onChange={setVal("name")}
                        placeholder="e.g. Elena Rostova"
                        disabled={loading}
                      />
                    )}
                  </Field>

                  <Field label="Organization / Entity" error={fieldError("organization")}>
                    {(control) => (
                      <Input
                        {...control}
                        name="organization"
                        value={values.organization}
                        onChange={setVal("organization")}
                        placeholder="e.g. Metro Food Bank"
                        disabled={loading}
                      />
                    )}
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email Address" required error={fieldError("email")}>
                    {(control) => (
                      <Input
                        {...control}
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={setVal("email")}
                        placeholder="contact@entity.org"
                        disabled={loading}
                      />
                    )}
                  </Field>

                  <Field label="Phone Number" required error={fieldError("phonenumber")}>
                    {(control) => (
                      <Input
                        {...control}
                        name="phonenumber"
                        type="tel"
                        value={values.phonenumber}
                        onChange={setVal("phonenumber")}
                        placeholder="+91 98765 43210"
                        disabled={loading}
                      />
                    )}
                  </Field>
                </div>

                <Field label="Password" required error={fieldError("password")}>
                  {(control) => (
                    <PasswordInput
                      {...control}
                      name="password"
                      value={values.password}
                      onChange={setVal("password")}
                      placeholder="Minimum 8 characters"
                      disabled={loading}
                    />
                  )}
                </Field>

                {/* Location with Autofill */}
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#0B1C30]">Operating Location</span>
                    <button
                      type="button"
                      onClick={fillFromLocation}
                      disabled={geo.busy || loading}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F5132] hover:underline disabled:opacity-50"
                    >
                      <LocateFixed className="size-3.5" />
                      <span>{geo.busy ? "Locating…" : "Use GPS Coordinates"}</span>
                    </button>
                  </div>

                  {geo.message && (
                    <p className="text-xs text-[#404942] mb-3">{geo.message}</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Pincode" required error={fieldError("pincode")}>
                      {(control) => (
                        <Input
                          {...control}
                          name="pincode"
                          value={values.pincode}
                          onChange={setVal("pincode")}
                          placeholder="560038"
                          disabled={loading}
                        />
                      )}
                    </Field>
                    <Field label="Area / City" required error={fieldError("area")}>
                      {(control) => (
                        <Input
                          {...control}
                          name="area"
                          value={values.area}
                          onChange={setVal("area")}
                          placeholder="Indiranagar"
                          disabled={loading}
                        />
                      )}
                    </Field>
                    <Field label="State" required error={fieldError("state")}>
                      {(control) => (
                        <Input
                          {...control}
                          name="state"
                          value={values.state}
                          onChange={setVal("state")}
                          placeholder="Karnataka"
                          disabled={loading}
                        />
                      )}
                    </Field>
                    <Field label="Country" error={fieldError("country")}>
                      {(control) => (
                        <Input
                          {...control}
                          name="country"
                          value={values.country}
                          onChange={setVal("country")}
                          disabled={loading}
                        />
                      )}
                    </Field>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-[#707971]">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-[#0F5132] hover:underline">
                      Sign in here
                    </Link>
                  </span>

                  <Button type="submit" disabled={loading} className="w-full sm:w-auto px-6 bg-[#0F5132] hover:bg-[#0A3D2A] text-white">
                    {loading ? "Registering…" : `Complete ${role} Registration`}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────────
          8. FOOTER
          ─────────────────────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-[#0B1C30] text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-[#213145]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-sm">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded bg-[#0F5132] text-white">
                <Flame className="size-4" />
              </span>
              <span className="font-display font-bold text-base tracking-tight">FOODSHARE PLATFORM</span>
            </div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              High-throughput surplus food rescue orchestration connecting enterprise donors with hunger-relief networks.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-xs text-[#CBD5E1]">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-white uppercase tracking-wider font-mono">Consoles</span>
              <Link href="/donordash" className="hover:text-white">Donor Staging Hub</Link>
              <Link href="/volunteerdash" className="hover:text-white">Volunteer Dispatch</Link>
              <Link href="/ngodash" className="hover:text-white">NGO Intake Portal</Link>
              <Link href="/adminpage" className="hover:text-white">Operations Command</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-bold text-white uppercase tracking-wider font-mono">Protocols</span>
              <span>5-Stage Deterministic Lifecycle</span>
              <span>Good Samaritan Act Standards</span>
              <span>EPA WARM Model Accounting</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-bold text-white uppercase tracking-wider font-mono">Interactive Demo</span>
              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="text-left text-[#68FCBF] font-semibold hover:underline"
              >
                Launch Multi-Role Sandbox
              </button>
              <Link href="/login" className="hover:text-white">Authentication Gateway</Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#213145] flex flex-col sm:flex-row items-center justify-between text-xs text-[#707971] gap-2">
          <span>&copy; {new Date().getFullYear()} FoodShare Platform. All rights reserved.</span>
          <span>Deterministic Food Recovery Standard</span>
        </div>
      </footer>

      {/* Interactive Demo Role Switcher Modal */}
      <DemoRoleSelectorModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
