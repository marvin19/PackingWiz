"use client"

import { useMemo } from "react"
import { CloudRain, Droplets, Sparkles, Users } from "lucide-react"
import { useStore } from "@/lib/store"
import { buildWeather } from "@/lib/generate"
import { durationDays, formatRange } from "@/lib/dates"
import { ScreenHeader } from "@/components/screen-header"
import { tripTypeIcon, accommodationIcon, bagIcon, weatherIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

const ACCOMMODATION_LABEL: Record<string, string> = {
  hotel: "Hotel",
  apartment: "Apartment",
  hostel: "Hostel",
  camping: "Camping",
  friends: "Friends & family",
  other: "Other",
}

const TYPE_LABEL: Record<string, string> = {
  vacation: "Vacation",
  business: "Business",
  city: "City break",
  beach: "Beach",
  outdoor: "Outdoors",
  training: "Training",
  race: "Race",
  ski: "Ski",
  camping: "Camping",
  family: "Family",
  other: "Other",
}

export function SummaryScreen() {
  const { draft, navigate } = useStore()
  const weather = useMemo(() => buildWeather(draft), [draft])
  const days = durationDays(draft.startDate, draft.endDate)

  const firstType = draft.types[0] ?? "vacation"
  const TypeIcon = tripTypeIcon(firstType)
  const AccIcon = accommodationIcon(draft.accommodation ?? "hotel")
  const typeValue = draft.types.length
    ? draft.types.map((t) => TYPE_LABEL[t]).join(", ")
    : TYPE_LABEL.vacation

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader title="Trip summary" onBack={() => navigate("create")} />

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        {/* hero */}
        <div className="mb-5">
          <p className="font-display text-2xl font-extrabold leading-tight text-foreground text-balance">
            {draft.destination || "Your trip"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {draft.country ? `${draft.country} · ` : ""}
            {formatRange(draft.startDate, draft.endDate)} · {days} {days === 1 ? "day" : "days"}
          </p>
        </div>

        {/* facts grid */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Fact icon={<TypeIcon className="h-4 w-4" />} label={draft.types.length > 1 ? "Trip types" : "Trip type"} value={typeValue} />
          <Fact icon={<AccIcon className="h-4 w-4" />} label="Staying in" value={ACCOMMODATION_LABEL[draft.accommodation ?? "hotel"]} />
          <Fact
            icon={<Users className="h-4 w-4" />}
            label="Travelers"
            value={`${draft.travelers.length} ${draft.travelers.length === 1 ? "person" : "people"}`}
          />
          <Fact
            icon={<Droplets className="h-4 w-4" />}
            label="Laundry"
            value={draft.laundry === "yes" ? "Available" : draft.laundry === "no" ? "None" : "Not sure"}
          />
        </div>

        {/* activities */}
        {draft.activities.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activities</p>
            <div className="flex flex-wrap gap-2">
              {draft.activities.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* bags */}
        {draft.bags.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Packing in
            </p>
            <div className="space-y-2">
              {draft.bags.map((bag) => {
                const BagIcon = bagIcon(bag.type)
                const owner = draft.travelers.find((t) => t.id === bag.ownerId)
                return (
                  <div
                    key={bag.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <BagIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-card-foreground">
                      {bag.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                      {owner ? owner.name : "Shared"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* weather card */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-card-foreground">
                {weather.mode === "forecast" ? "Forecast" : "Typical weather"}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {weather.high}° / {weather.low}°
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{weather.detail}</p>
            {weather.days && (
              <div className="mt-3 flex justify-between gap-1">
                {weather.days.map((d) => {
                  const Icon = weatherIcon(d.icon)
                  return (
                    <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground">{d.label}</span>
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-[11px] font-semibold text-foreground">{d.high}°</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {draft.note && (
          <div className="mb-2 rounded-2xl border border-dashed border-border bg-muted/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your note</p>
            <p className="mt-1 text-sm text-foreground">{draft.note}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-border bg-background px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={() => navigate("generating")}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5",
            "font-display text-base font-bold text-primary-foreground transition-transform active:scale-[0.98]",
          )}
        >
          <Sparkles className="h-5 w-5" />
          Generate my packing list
        </button>
      </div>
    </div>
  )
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-card-foreground">{value}</p>
    </div>
  )
}
