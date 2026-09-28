import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface APBButtonProps extends React.ComponentProps<typeof Button> {
  glow?: boolean
}

const APBButton = React.forwardRef<HTMLButtonElement, APBButtonProps>(
  ({ className, variant = "default", glow = false, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          "font-bold tracking-wide uppercase transition-all duration-300 active:scale-95 hover:scale-[1.02]",
          glow && variant === "default" && "glow-pulse shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.9)] hover:scale-105 active:scale-95 group border border-[var(--color-apb-cyan)]/50",
          glow && variant === "destructive" && "glow-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)] hover:shadow-[0_0_30px_rgba(244,63,94,0.9)] hover:scale-105 active:scale-95 group border border-destructive/50",
          className
        )}
        {...props}
      />
    )
  }
)
APBButton.displayName = "APBButton"

export { APBButton }
