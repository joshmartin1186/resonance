import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C45D3A] focus-visible:ring-opacity-40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#C45D3A] text-white hover:bg-[#A84D2E]",
        secondary: "border border-[#C45D3A] text-[#C45D3A] bg-transparent hover:bg-[#C45D3A] hover:text-white",
        ghost: "text-[#5A534C] hover:bg-[#F0EDE8]",
        link: "text-[#C45D3A] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
