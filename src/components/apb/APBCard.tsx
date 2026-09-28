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
          "bg-[#0a0f18]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:bg-[#0a0f18]/80 hover:border-white/10",
          glow && "shadow-[0_0_30px_rgba(34,211,238,0.15)] border-[var(--color-apb-cyan)]/30 glow-pulse",
          className
        )}
        {...props}
      />
    )
  }
)
APBCard.displayName = "APBCard"

export { APBCard }
