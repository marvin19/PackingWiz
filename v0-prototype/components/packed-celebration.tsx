"use client"

import { useMemo } from "react"
import { CircleCheck, ListChecks, PartyPopper } from "lucide-react"
import type { Trip } from "@/lib/types"

const CONFETTI_COLORS = [
  "var(--primary)",
  "var(--buy)",
  "var(--success)",
  "var(--chart-2)",
  "var(--chart-5)",
]

function ConfettiField() {
  // deterministic-ish spread of pieces so it looks full but stays lightweight
  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const left = (i * 2.4 + (i % 5) * 3) % 100
        const delay = (i % 9) * 0.22
        const duration = 2.6 + (i % 6) * 0.4
        const size = 6 + (i % 4) * 2
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const rounded = i % 3 === 0
        return { left, delay, duration, size, color, rounded, id: i }
      }),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="trove-confetti-piece absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            borderRadius: p.rounded ? "9999px" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

export function PackedCelebration({
  trip,
  onViewOverview,
  onDismiss,
}: {
  trip: Trip
  onViewOverview: () => void
  onDismiss: () => void
}) {
  const total = trip.items.length

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-primary/95 px-8 text-center backdrop-blur-sm animate-trove-fade">
      <ConfettiField />

      <div className="animate-trove-pop relative flex h-24 w-24 items-center justify-center rounded-full bg-primary-foreground/15 ring-4 ring-primary-foreground/25">
        <CircleCheck className="h-14 w-14 text-primary-foreground" strokeWidth={2.2} />
      </div>

      <h2 className="animate-trove-rise mt-6 font-display text-3xl font-extrabold text-primary-foreground [animation-delay:0.1s]">
        You&apos;re all packed!
      </h2>
      <p className="animate-trove-rise mt-2 max-w-[16rem] text-pretty text-sm leading-relaxed text-primary-foreground/80 [animation-delay:0.18s]">
        Every one of your {total} items for {trip.destination} is packed and ready. Have an amazing
        trip.
      </p>

      <div className="animate-trove-rise mt-8 flex w-full max-w-xs flex-col gap-2.5 [animation-delay:0.26s]">
        <button
          type="button"
          onClick={onViewOverview}
          className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground py-3 font-display text-sm font-bold text-primary transition-transform active:scale-[0.98]"
        >
          <ListChecks className="h-4 w-4" />
          View trip overview
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex items-center justify-center gap-2 rounded-full border border-primary-foreground/40 py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary-foreground/10"
        >
          <PartyPopper className="h-4 w-4" />
          Back to my list
        </button>
      </div>
    </div>
  )
}
