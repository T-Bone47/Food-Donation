"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { CircleCheck, Info, X } from "lucide-react"

type Tone = "success" | "info"
interface ToastItem {
  id: number
  message: string
  tone: Tone
}

const ToastContext = createContext<{ show: (message: string, tone?: Tone) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}

/** Success/info confirmations. Failures stay inline next to the action instead of vanishing. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), [])
  const show = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = ++nextId.current
      setItems((list) => [...list.slice(-2), { id, message, tone }])
      window.setTimeout(() => dismiss(id), 6000)
    },
    [dismiss]
  )
  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* The live region exists from first render so additions are announced. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(var(--header-h)+0.5rem)] z-[60] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm shadow-raised"
          >
            {t.tone === "success" ? (
              <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
            ) : (
              <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-status-assigned-fg" />
            )}
            <p className="min-w-0 flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-m-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-ink-soft hover:bg-muted"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
