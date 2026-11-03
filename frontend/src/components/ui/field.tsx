"use client"

import { useId, type ReactNode } from "react"
import { CircleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

/** Label + control + hint + error, wired together with ids so screen readers announce all of it. */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  className?: string
  children: (control: {
    id: string
    required?: boolean
    "aria-describedby"?: string
    "aria-invalid"?: true
  }) => ReactNode
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <>
            <span aria-hidden className="text-destructive"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {children({ id, required, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint ? (
        <p id={hintId} className="text-meta text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-meta font-medium text-destructive">
          <CircleAlert aria-hidden className="mt-px size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
