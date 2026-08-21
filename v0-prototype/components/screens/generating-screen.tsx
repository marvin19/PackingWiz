"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Loader2, Sparkles } from "lucide-react"
import { useStore } from "@/lib/store"

const STEPS = [
  "Reading your trip details",
  "Checking the weather in your destination",
  "Matching gear to your activities",
  "Adjusting quantities for laundry & trip length",
  "Finishing your personalized list",
]

export function GeneratingScreen() {
  const { commitDraftTrip, navigate, draft } = useStore()
  const [step, setStep] = useState(0)
  const committed = useRef(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i + 1), 650 * (i + 1)))
    })
    timers.push(
      setTimeout(() => {
        if (committed.current) return
        committed.current = true
        commitDraftTrip()
        navigate("packing")
      }, 650 * STEPS.length + 700),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
        <span className="absolute inset-2 rounded-full bg-primary/10" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-7 w-7" />
        </span>
      </div>

      <h1 className="font-display text-xl font-extrabold text-foreground text-balance">
        Building your list for {draft.destination || "your trip"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Trove is tailoring every item to this trip.
      </p>

      <ul className="mt-8 w-full max-w-xs space-y-3 text-left">
        {STEPS.map((label, i) => {
          const done = step > i
          const active = step === i
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors " +
                  (done
                    ? "bg-success text-primary-foreground"
                    : active
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground")
                }
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={
                  "text-sm transition-colors " +
                  (done || active ? "text-foreground" : "text-muted-foreground")
                }
              >
                {label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
