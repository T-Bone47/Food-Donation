import { Clock, ShieldCheck, ShieldX, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VerificationStatus } from "@/lib/types"

const VERIFICATION: Record<VerificationStatus, { label: string; Icon: LucideIcon; className: string }> = {
  pending: { label: "Pending review", Icon: Clock, className: "bg-status-picked-up-bg text-status-picked-up-fg border-status-picked-up-border" },
  approved: { label: "Approved", Icon: ShieldCheck, className: "bg-status-available-bg text-status-available-fg border-status-available-border" },
  rejected: { label: "Rejected", Icon: ShieldX, className: "bg-status-expired-bg text-status-expired-fg border-status-expired-border" },
}

/** NGO verification state. Icon + label, like the donation StatusBadge. */
export function VerificationBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  const { label, Icon, className: tone } = VERIFICATION[status]
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-meta font-semibold", tone, className)}>
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  )
}
