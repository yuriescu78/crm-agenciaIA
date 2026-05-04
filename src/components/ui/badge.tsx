import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight transition-all select-none",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white",
        secondary: "bg-neutral-100 text-neutral-600",
        success: "bg-[oklch(0.58_0.18_160/0.12)] text-[oklch(0.38_0.18_160)]",
        process: "bg-[oklch(0.52_0.26_258/0.12)] text-[oklch(0.35_0.26_258)]",
        warning: "bg-[oklch(0.75_0.14_80/0.15)] text-[oklch(0.45_0.14_80)]",
        danger: "bg-[oklch(0.58_0.20_20/0.12)] text-[oklch(0.38_0.20_20)]",
        amber: "bg-[oklch(0.68_0.22_38/0.12)] text-[oklch(0.48_0.22_38)]",
        outline: "border border-neutral-200 text-neutral-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
