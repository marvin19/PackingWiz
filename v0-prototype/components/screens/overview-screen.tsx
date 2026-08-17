"use client"

import { CloudRain, Lightbulb, ShoppingBag, Sparkles, Users } from "lucide-react"
import { useStore, packingStats } from "@/lib/store"
import { durationDays, formatFull } from "@/lib/dates"
import { ScreenHeader } from "@/components/screen-header"
import { ProgressBar } from "@/components/progress"
import { categoryIcon, weatherIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { PackingCategory } from "@/lib/types"

const CATEGORY_ORDER: PackingCategory[] = [
  "Essentials",
  "Clothing",
  "Shoes",
  "Toiletries",
  "Electronics",
  "Activities",
  "Weather",
]

export function OverviewScreen() {
  const { activeTrip, navigate } = useStore()

  if (!activeTrip) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ScreenHeader title="Trip overview" onBack={() => navigate("packing")} />
        <div className="flex flex-1 items-center justify-center px-8 text-center text-sm text-muted-foreground">
          No trip selected.
        </div>
      </div>
    )
  }

  const stats = packingStats(activeTrip)
  const days = durationDays(activeTrip.startDate, activeTrip.endDate)
  const buyItems = activeTrip.items.filter((i) => i.needToBuy)
  const weather = activeTrip.weather

  const perCategory = CATEGORY_ORDER.map((cat) => {
    const items = activeTrip.items.filter((i) => i.category === cat)
    const packed = items.filter((i) => i.packed).length
    return { cat, total: items.length, packed }
  }).filter((c) => c.total > 0)

  const multiTraveler = activeTrip.travelers.length > 1
  const perTraveler = [
    ...activeTrip.travelers.map((t) => {
      const items = activeTrip.items.filter((i) => i.assignedTo === t.id)
      return {
        id: t.id,
        name: t.name,
        sub: t.role,
        shared: false,
        total: items.length,
        packed: items.filter((i) => i.packed).length,
      }
    }),
    (() => {
      const items = activeTrip.items.filter((i) => !i.assignedTo)
      return {
        id: "shared",
        name: "Shared",
        sub: "Everyone",
        shared: true,
        total: items.length,
        packed: items.filter((i) => i.packed).length,
      }
    })(),
  ].filter((b) => b.total > 0)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader title="Trip overview" onBack={() => navigate("packing")} border />

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
        {/* progress card */}
        <div className="mb-5 rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-display text-sm font-bold text-card-foreground">Packing progress</span>
            <span className="font-display text-lg font-extrabold text-primary">{stats.pct}%</span>
          </div>
          <ProgressBar value={stats.pct} />
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.packed} of {stats.total} items packed
          </p>
        </div>

        {/* trip facts */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Stat value={`${days}`} label={days === 1 ? "day" : "days"} />
          <Stat value={`${activeTrip.travelers.length}`} label="travelers" icon={<Users className="h-3.5 w-3.5" />} />
          <Stat value={`${buyItems.length}`} label="to buy" icon={<ShoppingBag className="h-3.5 w-3.5" />} />
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          {formatFull(activeTrip.startDate)} — {formatFull(activeTrip.endDate)}
        </p>

        {/* AI insights */}
        {activeTrip.insights.length > 0 && (
          <section className="mb-5">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-bold text-foreground">Why Trove packed this</h2>
            </div>
            <div className="space-y-2">
              {activeTrip.insights.map((text, i) => (
                <div key={i} className="flex gap-2.5 rounded-2xl border border-border bg-card px-4 py-3">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-buy-foreground" />
                  <p className="text-sm leading-relaxed text-card-foreground">{text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* weather */}
        <section className="mb-5">
          <div className="mb-2 flex items-center gap-1.5">
            <CloudRain className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold text-foreground">
              {weather.mode === "forecast" ? "Forecast" : "Typical weather"}
            </h2>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{weather.summary}</span>
              <span className="font-display text-sm font-bold text-foreground">
                {weather.high}° / {weather.low}°
              </span>
            </div>
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
            {weather.rainfall && (
              <p className="mt-2 text-xs text-muted-foreground">Rainfall: {weather.rainfall}</p>
            )}
          </div>
        </section>

        {/* per traveler */}
        {multiTraveler && (
          <section className="mb-5">
            <div className="mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-bold text-foreground">By traveler</h2>
            </div>
            <div className="space-y-2">
              {perTraveler.map((p) => {
                const pct = p.total === 0 ? 0 : Math.round((p.packed / p.total) * 100)
                const done = p.packed === p.total
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                        p.shared
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary/15 text-primary",
                      )}
                    >
                      {p.shared ? <Users className="h-4 w-4" /> : p.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-card-foreground">
                          {p.name}
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            {p.sub}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-semibold",
                            done ? "text-success" : "text-muted-foreground",
                          )}
                        >
                          {p.packed}/{p.total}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={pct} trackClassName="h-1.5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* per category */}
        <section>
          <h2 className="mb-2 font-display text-sm font-bold text-foreground">By category</h2>
          <div className="space-y-2">
            {perCategory.map(({ cat, total, packed }) => {
              const Icon = categoryIcon(cat)
              const pct = total === 0 ? 0 : Math.round((packed / total) * 100)
              return (
                <div key={cat} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-card-foreground">{cat}</span>
                      <span className="text-xs text-muted-foreground">{packed}/{total}</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={pct} trackClassName="h-1.5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3 text-center">
      <p className="font-display text-xl font-extrabold text-foreground">{value}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
    </div>
  )
}
