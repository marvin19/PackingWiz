"use client"

import { Luggage, Backpack, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore, type Tab } from "@/lib/store"

const TABS: { id: Tab; label: string; icon: typeof Luggage }[] = [
  { id: "trips", label: "Trips", icon: Luggage },
  { id: "pack", label: "Pack", icon: Backpack },
  { id: "profile", label: "Profile", icon: User },
]

export function BottomNav() {
  const { activeTab, goToTab } = useStore()
  return (
    <nav
      aria-label="Primary"
      className="shrink-0 border-t border-border bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur"
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          const Icon = tab.icon
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => goToTab(tab.id)}
                aria-current={active ? "page" : undefined}
                className="flex w-full flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors"
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-accent text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {tab.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
