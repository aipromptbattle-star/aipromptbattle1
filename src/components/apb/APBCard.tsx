import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface APBCardProps extends React.ComponentProps<typeof Card> {
  glow?: boolean
}

const APBCard = React.forwardRef<HTMLDivElement, APBCardProps>(
  ({ className, glow = false, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] rounded-lg overflow-hidden",
          glow && "shadow-[0_0_20px_rgba(0,112,243,0.15)] border-[var(--color-apb-blue)]/30",
          className
        )}
        {...props}
      />
    )
  }
)
APBCard.displayName = "APBCard"

export { APBCard }
