import type { CSSProperties } from "react"
import { Ban, Check, TimerOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatWhen } from "@/lib/format"
import type { DonationStatus } from "@/lib/types"

const STEPS = [
  { key: "AVAILABLE", label: "Listed" },
  { key: "ASSIGNED", label: "Volunteer assigned" },
  { key: "PICKED_UP", label: "Picked up" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "COMPLETED", label: "Completed" },
] as const

type StepKey = (typeof STEPS)[number]["key"]

/** ISO timestamps keyed by lifecycle state. Pass only the ones that actually exist; none are invented. */
export type JourneyTimes = Partial<Record<StepKey | "CANCELLED" | "EXPIRED", string | null | undefined>>

// Shown on the current step only, so the DELIVERED / COMPLETED distinction is explicit.
const CURRENT_NOTE: Partial<Record<DonationStatus, string>> = {
  AVAILABLE: "Waiting for a volunteer",
  ASSIGNED: "Waiting for pickup",
  PICKED_UP: "On its way to an NGO",
  DELIVERED: "Waiting for the NGO to confirm receipt",
}

type State = "done" | "current" | "upcoming" | "stopped"
interface Item {
  key: string
  label: string
  state: State
  time?: string | null
  note?: string
  terminal?: "CANCELLED" | "EXPIRED"
}

export function buildJourney(status: DonationStatus, times: JourneyTimes = {}): Item[] {
  if (status === "CANCELLED" || status === "EXPIRED") {
    // A stopped donation shows only what actually happened, then where it ended.
    const reached: Item[] = STEPS.filter((s) => s.key === "AVAILABLE" || times[s.key]).map((s) => ({
      key: s.key,
      label: s.label,
      state: "done",
      time: times[s.key],
    }))
    reached.push({
      key: status,
      label: status === "CANCELLED" ? "Cancelled" : "Expired",
      state: "stopped",
      time: times[status],
      terminal: status,
    })
    return reached
  }
  const current = STEPS.findIndex((s) => s.key === status)
  return STEPS.map((s, i) => {
    const state: State = i < current ? "done" : i === current ? (status === "COMPLETED" ? "done" : "current") : "upcoming"
    return {
      key: s.key,
      label: s.label,
      state,
      time: times[s.key],
      note: state === "current" ? CURRENT_NOTE[status] : s.key === "COMPLETED" && state === "done" ? "Receipt confirmed by the NGO" : undefined,
    }
  })
}

const SR_STATE: Record<State, string> = {
  done: "Completed step",
  current: "Current step",
  upcoming: "Upcoming step",
  stopped: "Ended",
}

export function Journey({ status, times, className }: { status: DonationStatus; times?: JourneyTimes; className?: string }) {
  const items = buildJourney(status, times)
  return (
    <ol
      aria-label="Donation progress"
      style={{ "--cols": items.length } as CSSProperties}
      className={cn("grid grid-cols-1 gap-y-4 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]", className)}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <li
            key={item.key}
            aria-current={item.state === "current" ? "step" : undefined}
            className="relative flex gap-3 sm:flex-col sm:gap-2"
          >
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute -bottom-4 left-[13px] top-7 w-0.5 sm:bottom-auto sm:left-7 sm:top-[13px] sm:h-0.5 sm:w-[calc(100%-1.75rem)]",
                  item.state === "done" ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2",
                item.state === "done" && "border-primary bg-primary text-primary-foreground",
                item.state === "current" && "border-primary bg-card text-primary ring-4 ring-primary/20",
                item.state === "upcoming" && "border-input bg-card",
                item.state === "stopped" && "border-destructive bg-destructive-soft text-destructive"
              )}
            >
              {item.state === "done" && <Check className="size-4" strokeWidth={3} />}
              {item.state === "current" && <span className="size-2.5 rounded-full bg-primary" />}
              {item.terminal === "CANCELLED" && <Ban className="size-4" />}
              {item.terminal === "EXPIRED" && <TimerOff className="size-4" />}
            </span>
            <div className="min-w-0 pb-1 sm:pr-2">
              <p className={cn("text-sm", item.state === "upcoming" ? "text-muted-foreground" : "font-semibold text-foreground")}>
                <span className="sr-only">{SR_STATE[item.state]}: </span>
                {item.label}
              </p>
              {item.note ? <p className="text-meta text-ink-soft">{item.note}</p> : null}
              {item.time ? (
                <p className="text-meta text-muted-foreground">
                  <time dateTime={item.time}>{formatWhen(item.time)}</time>
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
