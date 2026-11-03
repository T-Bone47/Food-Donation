"use client";

import type { ReactNode } from "react";
import { Clock, MapPin, TimerOff, TriangleAlert, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { deadlineInfo, formatLocation, formatQuantity, formatWhen, type Urgency } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Donation } from "@/lib/types";

type CardDonation = Pick<
  Donation,
  "id" | "title" | "food_category" | "quantity" | "unit" | "pickup_address" | "area" | "state" | "pincode" | "pickup_deadline" | "expires_at"
> & { description?: string | null; status?: Donation["status"] };

const URGENCY: Record<Urgency, { Icon: LucideIcon; className: string }> = {
  passed: { Icon: TimerOff, className: "bg-destructive-soft text-status-expired-fg" },
  urgent: { Icon: TriangleAlert, className: "bg-destructive-soft text-status-expired-fg" },
  soon: { Icon: Clock, className: "bg-accent text-accent-foreground" },
  ok: { Icon: Clock, className: "bg-muted text-ink-soft" },
};

/**
 * One donation, laid out like a dispatch slip: what and where above the dashed rule, when and what to do below it.
 * Time-critical information sits next to the action, which is where a volunteer's eyes already are.
 */
export default function DonationCard({
  donation,
  showStatus = false,
  showDeadlines = true,
  heading = "h3",
  className,
  children,
}: {
  donation: CardDonation;
  showStatus?: boolean;
  /** Pickup/expiry block. Turn off where it no longer applies (e.g. already delivered). */
  showDeadlines?: boolean;
  heading?: "h2" | "h3";
  className?: string;
  /** Actions and extra facts, rendered below the dashed rule. */
  children?: ReactNode;
}) {
  const now = useNow();
  const Heading = heading;
  const pickup = deadlineInfo(donation.pickup_deadline, now);
  const chip = pickup ? URGENCY[pickup.urgency] : null;

  return (
    <article className={cn("flex h-full flex-col rounded-lg border bg-card shadow-card", className)}>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <Heading className="min-w-0 break-words text-lg font-semibold leading-snug">{donation.title}</Heading>
          {showStatus && donation.status ? <StatusBadge status={donation.status} /> : null}
        </div>
        <p className="text-sm font-medium text-ink-soft">
          {formatQuantity(donation.quantity, donation.unit)} · {donation.food_category}
        </p>
        <p className="flex gap-2 text-sm text-ink-soft">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-words">{formatLocation(donation)}</span>
        </p>
        {donation.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{donation.description}</p> : null}
      </div>
      {showDeadlines || children ? (
        <div className="flex flex-col gap-3 border-t-2 border-dashed border-border px-5 py-4">
          {showDeadlines ? (
            <dl className="grid gap-1.5 text-sm">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <dt className="font-semibold">Pick up by</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  {formatWhen(donation.pickup_deadline, now)}
                  {pickup && chip ? (
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-meta font-semibold", chip.className)}>
                      <chip.Icon aria-hidden className="size-3.5" />
                      {pickup.label}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex flex-wrap items-center gap-x-2">
                <dt className="text-ink-soft">Food expires</dt>
                <dd>{formatWhen(donation.expires_at, now)}</dd>
              </div>
            </dl>
          ) : null}
          {children}
        </div>
      ) : null}
    </article>
  );
}
