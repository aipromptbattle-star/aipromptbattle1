import * as React from "react"
import { cn } from "@/lib/utils"

interface TimerDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  time: string
  label?: string
  danger?: boolean
}

const TimerDisplay = React.forwardRef<HTMLDivElement, TimerDisplayProps>(
  ({ className, time, label = "TIME REMAINING", danger = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center text-center", className)}
        {...props}
      >
        <div className={cn(
          "text-4xl md:text-6xl font-mono font-bold tracking-tighter",
          danger ? "text-destructive shadow-destructive/50 drop-shadow-[0_0_8px_rgba(255,50,50,0.8)]" : "text-white"
        )}>
          {time}
        </div>
        {label && (
          <div className="text-xs md:text-sm tracking-widest text-muted-foreground uppercase mt-1">
            {label}
          </div>
        )}
      </div>
    )
  }
)
TimerDisplay.displayName = "TimerDisplay"

export { TimerDisplay }
