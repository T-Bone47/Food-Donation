import { Ban, CircleCheck, CircleDashed, PackageCheck, PackageOpen, TimerOff, UserCheck, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { statusLabel } from "@/lib/format"
import type { DonationStatus } from "@/lib/types"

// Full class strings (not built dynamically) so Tailwind can see them. Every status has an icon AND a label.
const STATUS: Record<DonationStatus, { label: string; Icon: LucideIcon; className: string }> = {
  AVAILABLE: { label: "Available", Icon: CircleDashed, className: "bg-status-available-bg text-status-available-fg border-status-available-border" },
  ASSIGNED: { label: "Assigned", Icon: UserCheck, className: "bg-status-assigned-bg text-status-assigned-fg border-status-assigned-border" },
  PICKED_UP: { label: "Picked up", Icon: PackageCheck, className: "bg-status-picked-up-bg text-status-picked-up-fg border-status-picked-up-border" },
  DELIVERED: { label: "Delivered", Icon: PackageOpen, className: "bg-status-delivered-bg text-status-delivered-fg border-status-delivered-border" },
  COMPLETED: { label: "Completed", Icon: CircleCheck, className: "bg-status-completed-bg text-status-completed-fg border-status-completed-border" },
  CANCELLED: { label: "Cancelled", Icon: Ban, className: "bg-status-cancelled-bg text-status-cancelled-fg border-status-cancelled-border" },
  EXPIRED: { label: "Expired", Icon: TimerOff, className: "bg-status-expired-bg text-status-expired-fg border-status-expired-border" },
}

export function StatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: DonationStatus | string;
  className?: string;
  showDot?: boolean;
}) {
  const known = (STATUS as Record<string, (typeof STATUS)[DonationStatus]>)[status]
  const { label, Icon, className: tone } =
    known ?? { label: statusLabel(status), Icon: CircleDashed, className: STATUS.CANCELLED.className }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider",
        tone,
        className
      )}
    >
      {showDot ? (
        <span className="size-1.5 rounded-full bg-current opacity-85" aria-hidden="true" />
      ) : (
        <Icon aria-hidden className="size-3.5" />
      )}
      {label}
    </span>
  )
}
