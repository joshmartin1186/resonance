import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-[#F0EDE8] text-[#2A2621]",
        success: "bg-[#E8F5EC] text-[#2D7D4F]",
        warning: "bg-[#FEF3C7] text-[#D97706]",
        error: "bg-[#FEE2E2] text-[#C2410C]",
        info: "bg-[#E0F2FE] text-[#0369A1]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
