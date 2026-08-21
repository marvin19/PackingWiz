"use client"

import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function ScreenHeader({
  title,
  onBack,
  right,
  border = false,
}: {
  title?: string
  onBack?: () => void
  right?: React.ReactNode
  border?: boolean
}) {
  return (
    <header
      className={cn(
        "flex items-center gap-2 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]",
        border && "border-b border-border",
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : (
        <span className="h-9 w-9" />
      )}
      <h1 className="flex-1 truncate text-center font-display text-base font-bold text-foreground">
        {title}
      </h1>
      <span className="flex h-9 min-w-9 items-center justify-end">{right}</span>
    </header>
  )
}
