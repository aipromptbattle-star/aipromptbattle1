import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = "READY" | "LIVE" | "PAUSED" | "CLOSED" | "ACTIVE" | "INACTIVE" | "OFFLINE" | "DRAFT" | "JUDGING" | "RESULTS" | "ENDED"

interface StatusBadgeProps extends React.ComponentProps<typeof Badge> {
  status: StatusType
  pulse?: boolean
}

const statusConfig: Record<StatusType, { colorClass: string, dotClass: string }> = {
  READY: { colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20", dotClass: "bg-blue-500" },
  LIVE: { colorClass: "bg-green-500/10 text-green-400 border-green-500/20", dotClass: "bg-green-500" },
  PAUSED: { colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20", dotClass: "bg-amber-500" },
  CLOSED: { colorClass: "bg-gray-500/10 text-gray-400 border-gray-500/20", dotClass: "bg-gray-500" },
  ACTIVE: { colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dotClass: "bg-emerald-500" },
  INACTIVE: { colorClass: "bg-red-500/10 text-red-400 border-red-500/20", dotClass: "bg-red-500" },
  OFFLINE: { colorClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", dotClass: "bg-zinc-500" },
  DRAFT: { colorClass: "bg-purple-500/10 text-purple-400 border-purple-500/20", dotClass: "bg-purple-500" },
  JUDGING: { colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", dotClass: "bg-indigo-500" },
  RESULTS: { colorClass: "bg-pink-500/10 text-pink-400 border-pink-500/20", dotClass: "bg-pink-500" },
  ENDED: { colorClass: "bg-gray-500/10 text-gray-400 border-gray-500/20", dotClass: "bg-gray-500" },
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, pulse = false, ...props }, ref) => {
    const config = statusConfig[status]

    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn(
          "font-mono tracking-wider font-semibold uppercase px-2 py-0.5",
          config.colorClass,
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {(pulse || status === "LIVE") && (
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.dotClass)} />
            )}
            <span className={cn("relative inline-flex rounded-full h-2 w-2", config.dotClass)} />
          </span>
          {status}
        </span>
      </Badge>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge }
