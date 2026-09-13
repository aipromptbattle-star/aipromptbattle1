import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { APBButton } from "./APBButton"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  destructive?: boolean
  typedConfirmationPhrase?: string
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  onConfirm,
  destructive = false,
  typedConfirmationPhrase,
}: ConfirmationDialogProps) {
  const [typedValue, setTypedValue] = React.useState("")

  React.useEffect(() => {
    if (!open) {
      setTypedValue("")
    }
  }, [open])

  const isConfirmDisabled = Boolean(
    typedConfirmationPhrase && typedValue.trim() !== typedConfirmationPhrase.trim()
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-mono uppercase tracking-widest text-white">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground whitespace-pre-line leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {typedConfirmationPhrase && (
          <div className="space-y-2 py-2">
            <p className="text-xs font-mono text-amber-400">
              To proceed, please type <span className="font-bold underline select-all">{typedConfirmationPhrase}</span> below:
            </p>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={typedConfirmationPhrase}
              className="w-full h-9 rounded bg-black/60 border border-[var(--color-apb-surface-border)] px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
          <APBButton variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {cancelText}
          </APBButton>
          <APBButton
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            disabled={isConfirmDisabled}
            glow={!destructive && !isConfirmDisabled}
            className="w-full sm:w-auto font-mono uppercase text-xs"
          >
            {confirmText}
          </APBButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

