import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#CDC9C2] bg-white px-3.5 py-2.5 text-sm text-[#2A2621] placeholder:text-[#8A827A] focus:outline-none focus:ring-2 focus:ring-[#C45D3A] focus:ring-opacity-40 focus:border-[#C45D3A] transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
