import * as React from "react"
import { APBCard } from "./APBCard"
import { StatusBadge, StatusType } from "./StatusBadge"
import { cn } from "@/lib/utils"

interface RoundStatusProps extends React.ComponentProps<typeof APBCard> {
  roundNumber: number
  totalRounds?: number
  title?: string
  status: StatusType
  isActive?: boolean
}

const RoundStatus = React.forwardRef<HTMLDivElement, RoundStatusProps>(
  ({ className, roundNumber, totalRounds, title, status, isActive = false, ...props }, ref) => {
    return (
      <APBCard ref={ref} glow={isActive} className={cn("p-4 flex flex-col space-y-3", className)} {...props}>
        <div className="flex items-center justify-between">
          <div className="font-mono text-lg font-bold text-white tracking-widest uppercase">
            Round {roundNumber.toString().padStart(2, "0")}
            {totalRounds && <span className="text-muted-foreground"> / {totalRounds.toString().padStart(2, "0")}</span>}
          </div>
          <StatusBadge status={status} />
        </div>
        {title && (
          <div className="text-sm text-muted-foreground font-medium">
            {title}
          </div>
        )}
      </APBCard>
    )
  }
)
RoundStatus.displayName = "RoundStatus"

export { RoundStatus }
