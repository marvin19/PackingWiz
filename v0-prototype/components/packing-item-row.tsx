"use client"

import { useState } from "react"
import { Check, Minus, Plus, ShoppingBag, Trash2, Info } from "lucide-react"
import { useStore } from "@/lib/store"
import type { PackingItem, Traveler } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PackingItemRow({
  item,
  travelers,
}: {
  item: PackingItem
  travelers: Traveler[]
}) {
  const { togglePacked, setQuantity, toggleNeedToBuy, deleteItem, assignItem } = useStore()
  const [expanded, setExpanded] = useState(false)

  const assigned = travelers.find((t) => t.id === item.assignedTo)
  const showAssign = travelers.length > 1

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-colors",
        item.packed ? "border-border/60 bg-muted/40" : "border-border",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* check */}
        <button
          type="button"
          onClick={() => togglePacked(item.id)}
          aria-label={item.packed ? `Mark ${item.name} as not packed` : `Mark ${item.name} as packed`}
          aria-pressed={item.packed}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            item.packed
              ? "border-success bg-success text-primary-foreground"
              : "border-border bg-background text-transparent active:border-primary",
          )}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </button>

        {/* name + meta */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 flex-col items-start text-left"
        >
          <span
            className={cn(
              "truncate text-sm font-medium",
              item.packed ? "text-muted-foreground line-through" : "text-card-foreground",
            )}
          >
            {item.name}
          </span>
          <span className="flex items-center gap-1.5">
            {item.needToBuy && (
              <span className="inline-flex items-center gap-1 rounded-full bg-buy/15 px-1.5 py-0.5 text-[11px] font-semibold text-buy-foreground">
                <ShoppingBag className="h-3 w-3" />
                Buy
              </span>
            )}
            {assigned && (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                {assigned.name}
              </span>
            )}
            {item.note && !item.needToBuy && !assigned && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Info className="h-3 w-3" />
                Why this?
              </span>
            )}
          </span>
        </button>

        {/* quantity stepper */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label={`Decrease quantity of ${item.name}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground transition-colors active:bg-secondary disabled:opacity-30"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-5 text-center text-sm font-semibold tabular-nums text-foreground">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(item.id, item.quantity + 1)}
            aria-label={`Increase quantity of ${item.name}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground transition-colors active:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* expanded actions */}
      {expanded && (
        <div className="border-t border-border px-3 py-3">
          {item.note && (
            <div className="mb-3 flex gap-2 rounded-xl bg-accent/40 px-3 py-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-accent-foreground">{item.note}</p>
            </div>
          )}

          {showAssign && (
            <div className="mb-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Assign to
              </p>
              <div className="flex flex-wrap gap-1.5">
                <AssignChip
                  active={!item.assignedTo}
                  onClick={() => assignItem(item.id, null)}
                  label="Everyone"
                />
                {travelers.map((t) => (
                  <AssignChip
                    key={t.id}
                    active={item.assignedTo === t.id}
                    onClick={() => assignItem(item.id, t.id)}
                    label={t.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleNeedToBuy(item.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-colors",
                item.needToBuy
                  ? "bg-buy/20 text-buy-foreground"
                  : "bg-muted text-foreground active:bg-secondary",
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {item.needToBuy ? "On shopping list" : "Need to buy"}
            </button>
            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              aria-label={`Remove ${item.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-destructive transition-colors active:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AssignChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground active:bg-muted",
      )}
    >
      {label}
    </button>
  )
}
