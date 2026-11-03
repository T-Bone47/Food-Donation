"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { InlineAlert } from "@/components/ui/states"
import { errorMessages, getApiError, type ApiError } from "@/lib/api-envelope"

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  /** Extra content between the description and the buttons (e.g. a form). */
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: "default" | "destructive"
  confirmDisabled?: boolean
  /** Throw (e.g. a rejected API call) to keep the dialog open and show the server's message. */
  onConfirm: () => Promise<void> | void
  onClose: () => void
  /** Called with the normalised error when onConfirm throws, e.g. to refresh stale data after a 409. */
  onError?: (error: ApiError) => void
}

/**
 * Accessible modal built on the native <dialog>: focus is trapped, Escape closes it, the page behind is inert,
 * and focus returns to the trigger. Destructive confirmations start focus on Cancel.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  confirmDisabled,
  onConfirm,
  onClose,
  onError,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const titleId = useId()
  const descId = useId()
  const hasForm = Boolean(children)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setError(null)
      dialog.showModal()
      // With a form inside, the browser's default (first field) is the right start; otherwise pick the safe button.
      if (!hasForm) (tone === "destructive" ? cancelRef : confirmRef).current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, tone, hasForm])

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      const apiError = getApiError(e)
      setError(apiError)
      onError?.(apiError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      // React re-dispatches <dialog>'s close/cancel events up the component tree, so a dialog nested inside another
      // would otherwise close its parent too. Only react to events that originate on this dialog.
      onCancel={(e) => {
        if (e.target === e.currentTarget && busy) e.preventDefault()
      }}
      onClose={(e) => {
        if (e.target === e.currentTarget && open) onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
      className="w-[calc(100%-2rem)] max-w-md rounded-lg bg-card p-0 text-card-foreground shadow-overlay"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 id={titleId} className="text-heading font-semibold">
          {title}
        </h2>
        {description ? (
          <div id={descId} className="text-ink-soft">
            {description}
          </div>
        ) : null}
        {children}
        {error ? (
          <InlineAlert tone="error">
            {errorMessages(error).map((m) => (
              <p key={m}>{m}</p>
            ))}
          </InlineAlert>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} type="button" variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            loading={busy}
            disabled={confirmDisabled}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
