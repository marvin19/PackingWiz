"use client"

import { Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function OptionCard({
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string
  icon: LucideIcon
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-colors",
        selected
          ? "border-primary bg-accent"
          : "border-border bg-card active:bg-muted",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span
        className={cn(
          "text-sm font-semibold",
          selected ? "text-foreground" : "text-foreground",
        )}
      >
        {label}
      </span>
    </button>
  )
}

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground active:bg-muted",
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

export function RadioRow({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
        selected ? "border-primary bg-accent" : "border-border bg-card active:bg-muted",
      )}
    >
      <span className="text-foreground">{label}</span>
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
    </button>
  )
}
