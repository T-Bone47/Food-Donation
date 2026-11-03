import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex max-w-full cursor-pointer select-none items-center justify-center gap-2 rounded-md text-center text-sm font-semibold transition-all duration-100 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        outline: "border border-input bg-card text-foreground hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-border",
        ghost: "text-foreground hover:bg-muted",
        link: "text-primary underline underline-offset-4 hover:text-primary-hover",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-11 px-3 py-1.5 md:min-h-9",
        lg: "min-h-12 px-6 py-2.5 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Disables the button and shows a spinner; keep the label so the action stays readable. */
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
