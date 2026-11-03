import type { DonationStatus } from "@/lib/types";

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function parse(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value?: string | null): string {
  const d = parse(value);
  return d ? dateTime.format(d) : "—";
}

const timeOnly = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayMonth = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Compact, scannable time for deadlines: "Today, 6:30 PM", "Tomorrow, 9:00 AM", "29 Oct, 6:30 PM" (year only when it differs). */
export function formatWhen(value: string | null | undefined, now: number = Date.now()): string {
  const d = parse(value);
  if (!d) return "—";
  const days = Math.round((startOfDay(d) - startOfDay(new Date(now))) / 86_400_000);
  const time = timeOnly.format(d);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days === -1) return `Yesterday, ${time}`;
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return `${(sameYear ? dayMonth : dayMonthYear).format(d)}, ${time}`;
}

export function formatDate(value?: string | null): string {
  const d = parse(value);
  return d ? dateOnly.format(d) : "—";
}

const SINGULAR: Record<string, string> = { servings: "serving", packets: "packet", liters: "liter", boxes: "box" };

export function formatQuantity(quantity: number, unit: string): string {
  const n = Number(quantity);
  return `${n} ${n === 1 ? (SINGULAR[unit] ?? unit) : unit}`;
}

/** Per-unit totals ("40 servings · 12 kg"). Never sums across units. */
export function formatUnitTotals(byUnit: Record<string, number> | undefined | null): string {
  const parts = Object.entries(byUnit ?? {})
    .filter(([, qty]) => Number(qty) > 0)
    .map(([unit, qty]) => formatQuantity(qty, unit));
  return parts.length > 0 ? parts.join(" · ") : "None yet";
}

export function formatLocation(d: { pickup_address?: string | null; area?: string | null; state?: string | null; pincode?: string | null }): string {
  const parts = [d.pickup_address, d.area, d.state].filter((p): p is string => Boolean(p && p.trim()));
  const base = parts.join(", ");
  return d.pincode ? `${base}${base ? " " : ""}(${d.pincode})` : base || "Location not specified";
}

export function statusLabel(status: DonationStatus | string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export type Urgency = "passed" | "urgent" | "soon" | "ok";

/** Time left until `iso`, to the minute. Urgent < 1 h, soon < 3 h. */
export function deadlineInfo(iso: string | null | undefined, now: number): { label: string; urgency: Urgency } | null {
  const d = parse(iso);
  if (!d) return null;
  const mins = Math.round((d.getTime() - now) / 60_000);
  const span = (m: number) => {
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h === 0) return `${m} min`;
    if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
    return r === 0 ? `${h} h` : `${h} h ${r} min`;
  };
  if (mins <= 0) return { label: `passed ${span(Math.max(1, -mins))} ago`, urgency: "passed" };
  return { label: `in ${span(mins)}`, urgency: mins < 60 ? "urgent" : mins < 180 ? "soon" : "ok" };
}

/** "Just now", "5 min ago", "3 h ago", "2 d ago", then the date. For feeds where exact time matters less than recency. */
export function formatAgo(iso: string | null | undefined, now: number): string {
  const d = parse(iso);
  if (!d) return "—";
  const mins = Math.floor((now - d.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} d ago` : dateOnly.format(d);
}
