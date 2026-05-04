import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold tracking-tight transition-all outline-none select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600 hover:shadow-primary-500/40",
        outline: "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300",
        secondary: "border border-neutral-200 bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
        ghost: "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border-none bg-transparent",
        destructive: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600",
        amber: "bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600",
      },
      size: {
        default: "h-10 px-5 gap-2",
        xs: "h-7 px-2.5 text-[11px] gap-1",
        sm: "h-8 px-3.5 text-[12px] gap-1.5",
        lg: "h-12 px-7 text-[15px] gap-2.5",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
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
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
