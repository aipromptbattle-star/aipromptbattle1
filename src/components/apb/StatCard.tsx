import * as React from "react"
import { APBCard } from "./APBCard"
import { cn } from "@/lib/utils"

interface StatCardProps extends React.ComponentProps<typeof APBCard> {
  label: string
  value: string | number
  subValue?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, subValue, ...props }, ref) => {
    return (
      <APBCard ref={ref} className={cn("p-4 flex flex-col justify-center", className)} {...props}>
        <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-mono font-bold text-white">
            {value}
          </div>
          {subValue && (
            <div className="text-sm font-medium text-muted-foreground">
              {subValue}
            </div>
          )}
        </div>
      </APBCard>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
