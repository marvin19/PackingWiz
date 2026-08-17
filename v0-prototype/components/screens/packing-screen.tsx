"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  CircleCheck,
  ListChecks,
  Plus,
  Sparkles,
  ShoppingBag,
  X,
} from "lucide-react"
import { useStore, packingStats } from "@/lib/store"
import type { PackingCategory } from "@/lib/types"
import { formatRange } from "@/lib/dates"
import { ProgressRing } from "@/components/progress"
import { categoryIcon } from "@/components/icons"
import { PackingItemRow } from "@/components/packing-item-row"
import { PackedCelebration } from "@/components/packed-celebration"
import { cn } from "@/lib/utils"

const CATEGORY_ORDER: PackingCategory[] = [
  "Essentials",
  "Clothing",
  "Shoes",
  "Toiletries",
  "Electronics",
  "Activities",
  "Weather",
]

type Filter = "all" | "todo" | "buy"

export function PackingScreen() {
  const { activeTrip, navigate, addItem } = useStore()
  const [filter, setFilter] = useState<Filter>("all")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCat, setNewCat] = useState<PackingCategory>("Essentials")
  const [celebrate, setCelebrate] = useState(false)

  const stats = packingStats(activeTrip)
  const buyCount = activeTrip?.items.filter((i) => i.needToBuy).length ?? 0

  const tripId = activeTrip?.id ?? null
  const prevPct = useRef(stats.pct)
  const prevTripId = useRef(tripId)

  useEffect(() => {
    // reset celebration tracking when switching trips
    if (prevTripId.current !== tripId) {
      prevTripId.current = tripId
      prevPct.current = stats.pct
      setCelebrate(false)
      return
    }
    // celebrate only on the transition into a fully-packed list
    if (stats.total > 0 && stats.pct === 100 && prevPct.current < 100) {
      setCelebrate(true)
    }
    prevPct.current = stats.pct
  }, [stats.pct, stats.total, tripId])

  const grouped = useMemo(() => {
    if (!activeTrip) return []
    const items = activeTrip.items.filter((i) => {
      if (filter === "todo") return !i.packed
      if (filter === "buy") return i.needToBuy
      return true
    })
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: items.filter((i) => i.category === cat),
    })).filter((g) => g.items.length > 0)
  }, [activeTrip, filter])

  if (!activeTrip) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No trip selected yet. Create a trip to see your packing list.
        </p>
        <button
          type="button"
          onClick={() => navigate("create")}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Create a trip
        </button>
      </div>
    )
  }

  function submitNew() {
    const name = newName.trim()
    if (!name) return
    addItem(name, newCat)
    setNewName("")
    setAdding(false)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {celebrate && (
        <PackedCelebration
          trip={activeTrip}
          onViewOverview={() => {
            setCelebrate(false)
            navigate("overview")
          }}
          onDismiss={() => setCelebrate(false)}
        />
      )}

      {/* header with progress */}
      <header className="px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-extrabold text-foreground">
              {activeTrip.destination}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatRange(activeTrip.startDate, activeTrip.endDate)} · {stats.total} items
            </p>
          </div>
          <ProgressRing value={stats.pct} size={58} stroke={6}>
            <span className="font-display text-sm font-extrabold text-foreground">{stats.pct}%</span>
          </ProgressRing>
        </div>

        <button
          type="button"
          onClick={() => navigate("overview")}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-secondary py-2 text-xs font-semibold text-secondary-foreground transition-colors active:bg-accent"
        >
          <ListChecks className="h-3.5 w-3.5" />
          View trip overview & insights
        </button>
      </header>

      {/* filters */}
      <div className="flex gap-2 px-5 pb-2">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        <FilterPill active={filter === "todo"} onClick={() => setFilter("todo")} label={`To pack (${stats.total - stats.packed})`} />
        <FilterPill
          active={filter === "buy"}
          onClick={() => setFilter("buy")}
          label={`Shopping (${buyCount})`}
          icon={<ShoppingBag className="h-3 w-3" />}
        />
      </div>

      {/* list */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-1">
        {filter === "buy" && buyCount > 0 && (
          <div className="mb-3 flex gap-2 rounded-2xl border border-buy/30 bg-buy/10 px-4 py-3">
            <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-buy-foreground" />
            <p className="text-xs leading-relaxed text-buy-foreground">
              These are items Trove thinks you&apos;ll need to buy before you go. Toggle any item&apos;s
              &quot;Need to buy&quot; to manage this list.
            </p>
          </div>
        )}

        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filter === "buy"
                ? "Nothing on your shopping list — you're all set."
                : "Nothing here. Nice work!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ cat, items }) => {
              const Icon = categoryIcon(cat)
              const isCollapsed = collapsed[cat]
              const packedInCat = items.filter((i) => i.packed).length
              const allPacked = packedInCat === items.length
              return (
                <section key={cat}>
                  <button
                    type="button"
                    onClick={() => setCollapsed((p) => ({ ...p, [cat]: !p[cat] }))}
                    className="mb-2 flex w-full items-center gap-2"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                        allPacked
                          ? "bg-success text-primary-foreground"
                          : "bg-accent text-accent-foreground",
                      )}
                    >
                      {allPacked ? <CircleCheck className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span
                      className={cn(
                        "font-display text-sm font-bold transition-colors",
                        allPacked ? "text-success" : "text-foreground",
                      )}
                    >
                      {cat}
                    </span>
                    {allPacked ? (
                      <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                        <CircleCheck className="h-3 w-3" />
                        All packed
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {packedInCat}/{items.length}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <PackingItemRow key={item.id} item={item} travelers={activeTrip.travelers} />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>

      {/* add item */}
      {adding ? (
        <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Add an item</span>
            <button
              type="button"
              onClick={() => setAdding(false)}
              aria-label="Cancel adding item"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submitNew()
            }}
            placeholder="e.g. Reusable water bottle"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setNewCat(cat)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  newCat === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={submitNew}
            disabled={!newName.trim()}
            className="mt-3 w-full rounded-full bg-primary py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            Add to list
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-label="Add item"
          className="absolute bottom-6 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground active:bg-secondary",
      )}
    >
      {icon}
      {label}
    </button>
  )
}
