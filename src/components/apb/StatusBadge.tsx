import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Play, Pause, Square, Zap, Clock, FileEdit, CheckCircle2, Award, ShieldAlert } from "lucide-react"

export type StatusType = "READY" | "STARTING" | "LIVE" | "PAUSED" | "CLOSED" | "ACTIVE" | "INACTIVE" | "OFFLINE" | "DRAFT" | "JUDGING" | "RESULTS" | "ENDED"

interface StatusBadgeProps extends React.ComponentProps<typeof Badge> {
  status: StatusType
  pulse?: boolean
  showIcon?: boolean
}

const statusConfig: Record<StatusType, { colorClass: string, dotClass: string, icon: React.ComponentType<{ className?: string }> }> = {
  READY: { colorClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", dotClass: "bg-cyan-400", icon: Zap },
  STARTING: { colorClass: "bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse", dotClass: "bg-amber-400", icon: Clock },
  LIVE: { colorClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotClass: "bg-emerald-400", icon: Play },
  PAUSED: { colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/30", dotClass: "bg-amber-500", icon: Pause },
  CLOSED: { colorClass: "bg-gray-500/10 text-gray-400 border-gray-500/30", dotClass: "bg-gray-500", icon: Square },
  ACTIVE: { colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dotClass: "bg-emerald-500", icon: CheckCircle2 },
  INACTIVE: { colorClass: "bg-red-500/10 text-red-400 border-red-500/30", dotClass: "bg-red-500", icon: ShieldAlert },
  OFFLINE: { colorClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30", dotClass: "bg-zinc-500", icon: Square },
  DRAFT: { colorClass: "bg-purple-500/10 text-purple-400 border-purple-500/30", dotClass: "bg-purple-500", icon: FileEdit },
  JUDGING: { colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", dotClass: "bg-indigo-500", icon: Clock },
  RESULTS: { colorClass: "bg-pink-500/10 text-pink-400 border-pink-500/30", dotClass: "bg-pink-500", icon: Award },
  ENDED: { colorClass: "bg-gray-500/10 text-gray-400 border-gray-500/30", dotClass: "bg-gray-500", icon: Square },
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, pulse = false, showIcon = true, ...props }, ref) => {
    const config = statusConfig[status] || statusConfig.READY
    const Icon = config.icon

    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn(
          "font-mono tracking-wider font-semibold uppercase px-2.5 py-1 text-xs inline-flex items-center gap-1.5",
          config.colorClass,
          className
        )}
        {...props}
      >
        {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {(pulse || status === "LIVE" || status === "STARTING") && (
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

