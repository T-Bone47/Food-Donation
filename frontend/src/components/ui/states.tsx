"use client"

import Link from "next/link"
import { useEffect, useRef, type ReactNode } from "react"
import { CircleAlert, CircleCheck, Info, RefreshCw, TriangleAlert, X, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { errorMessages, type ApiError } from "@/lib/api-envelope"
import { Button } from "@/components/ui/button"

type Tone = "error" | "warning" | "info" | "success"

const TONES: Record<Tone, { Icon: LucideIcon; box: string; icon: string }> = {
  error: { Icon: CircleAlert, box: "border-destructive bg-destructive-soft", icon: "text-destructive" },
  warning: { Icon: TriangleAlert, box: "border-status-picked-up-border bg-accent", icon: "text-accent-foreground" },
  info: { Icon: Info, box: "border-status-assigned-border bg-status-assigned-bg", icon: "text-status-assigned-fg" },
  success: { Icon: CircleCheck, box: "border-status-available-border bg-primary-soft", icon: "text-primary" },
}

/**
 * Inline message. Errors use role="alert" so they are announced; `focusOnMount` suits form error summaries.
 * Pass `role="alert"` for a non-error message that appears because an action did not go through.
 */
export function InlineAlert({
  tone = "info",
  title,
  children,
  onDismiss,
  focusOnMount,
  role,
  className,
}: {
  tone?: Tone
  title?: string
  children?: ReactNode
  onDismiss?: () => void
  focusOnMount?: boolean
  role?: "alert" | "status"
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusOnMount) ref.current?.focus()
  }, [focusOnMount])
  const { Icon, box, icon } = TONES[tone]

  return (
    <div
      ref={ref}
      tabIndex={focusOnMount ? -1 : undefined}
      role={role ?? (tone === "error" ? "alert" : "status")}
      className={cn("flex gap-3 rounded-md border p-3 text-sm text-foreground", box, className)}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-5 shrink-0", icon)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn("flex flex-col gap-1", title && "mt-0.5")}>{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="-m-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-ink-soft hover:bg-card"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  as: Heading = "h2",
}: {
  icon: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  /** Use "h1" when the empty state is the whole page (e.g. wrong role) so the page still has a main heading. */
  as?: "h1" | "h2"
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-card px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <Icon aria-hidden className="size-6" />
      </span>
      <Heading className="mt-4 break-words text-heading font-semibold">{title}</Heading>
      {children ? <p className="mt-1 max-w-md text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/** Failed load. Shows what the server said, a reference id for support, and the right next step. */
export function ErrorState({
  error,
  onRetry,
  title = "We couldn't load this",
}: {
  error: ApiError
  onRetry?: () => void
  title?: string
}) {
  return (
    <div role="alert" className="rounded-lg border border-destructive bg-destructive-soft p-5">
      <div className="flex gap-3">
        <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          <div className="mt-1 flex flex-col gap-1 text-sm">
            {errorMessages(error).map((m) => (
              <p key={m}>{m}</p>
            ))}
          </div>
          {error.requestId ? (
            <p className="mt-2 text-meta text-ink-soft">
              Reference: <code data-ui="ref-id" className="font-mono text-xs">{error.requestId}</code>
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {error.isAuth ? (
              <Button asChild size="sm">
                <Link href="/login">Sign in again</Link>
              </Button>
            ) : null}
            {onRetry && !error.isAuth ? (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw aria-hidden />
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} />
}

export function ListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div role="status" className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border bg-card p-5 shadow-card">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-6 h-11 w-full" />
        </div>
      ))}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <h1 className="break-words font-display text-title font-semibold tracking-tight text-balance sm:text-display">{title}</h1>
        {description ? <p className="mt-2 text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

/** A row of headline numbers. Callers format values (per-unit totals, never sums across units). */
export function StatList({
  items,
  className,
}: {
  items: { label: string; value: ReactNode; hint?: string }[]
  className?: string
}) {
  return (
    <dl className={cn("grid gap-4 rounded-lg border bg-card p-5 shadow-card sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]", className)}>
      {items.map((s) => (
        <div key={s.label}>
          <dt className="text-sm text-ink-soft">{s.label}</dt>
          <dd className="mt-1 text-title font-semibold">{s.value}</dd>
          {s.hint ? <p className="mt-1 text-meta text-muted-foreground">{s.hint}</p> : null}
        </div>
      ))}
    </dl>
  )
}
