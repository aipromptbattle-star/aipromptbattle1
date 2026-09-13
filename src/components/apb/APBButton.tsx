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
          "font-bold tracking-wide uppercase transition-all duration-300",
          glow && variant === "default" && "shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] border border-[var(--color-apb-cyan)]/50",
          glow && variant === "destructive" && "shadow-[0_0_15px_rgba(255,50,50,0.4)] hover:shadow-[0_0_25px_rgba(255,50,50,0.6)] border border-destructive/50",
          className
        )}
        {...props}
      />
    )
  }
)
APBButton.displayName = "APBButton"

export { APBButton }
