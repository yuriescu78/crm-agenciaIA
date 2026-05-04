import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-[13px] font-medium text-neutral-800 transition-all placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-4 aria-invalid:ring-red-500/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
