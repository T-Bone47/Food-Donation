import * as React from "react"

import { cn } from "@/lib/utils"

/** Shared look for native form controls (input, select, textarea). 16px text avoids iOS zoom-on-focus. */
export const controlClass =
  "block h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-[invalid=true]:border-destructive aria-[invalid=true]:border-2"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(controlClass, className)} {...props} />
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(controlClass, "h-auto min-h-24 py-2", className)} {...props} />
}

export { Input, Textarea }
