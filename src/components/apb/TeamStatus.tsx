import * as React from "react"
import { APBCard } from "./APBCard"
import { StatusBadge, StatusType } from "./StatusBadge"
import { cn } from "@/lib/utils"

interface TeamStatusProps extends React.ComponentProps<typeof APBCard> {
  teamId: string
  teamName?: string
  status: StatusType
  sessions?: { current: number; max: number }
}

const TeamStatus = React.forwardRef<HTMLDivElement, TeamStatusProps>(
  ({ className, teamId, teamName, status, sessions, ...props }, ref) => {
    return (
      <APBCard ref={ref} className={cn("p-4 flex items-center justify-between", className)} {...props}>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-white">{teamId}</span>
            {teamName && <span className="text-sm text-muted-foreground hidden sm:inline-block">— {teamName}</span>}
          </div>
          {sessions && (
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Sessions: {sessions.current} / {sessions.max}
            </div>
          )}
        </div>
        <div>
          <StatusBadge status={status} />
        </div>
      </APBCard>
    )
  }
)
TeamStatus.displayName = "TeamStatus"

export { TeamStatus }
