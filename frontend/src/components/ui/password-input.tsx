"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/** Password field with a show/hide toggle. The toggle keeps a fixed label and exposes its state via aria-pressed. */
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [shown, setShown] = React.useState(false)
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className={cn("pr-12", className)} />
      <button
        type="button"
        aria-pressed={shown}
        aria-label="Show password"
        onClick={() => setShown((s) => !s)}
        className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-md text-ink-soft hover:text-foreground"
      >
        {shown ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  )
}
