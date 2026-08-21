"use client"

import { useState } from "react"
import {
  Bell,
  ChevronRight,
  Globe,
  Luggage,
  Plane,
  Plus,
  Ruler,
  Sparkles,
  Users,
} from "lucide-react"
import { useStore } from "@/lib/store"

export function ProfileScreen() {
  const { trips } = useStore()
  const [metric, setMetric] = useState(true)
  const [smartQty, setSmartQty] = useState(true)
  const [reminders, setReminders] = useState(true)

  const totalTrips = trips.length
  const totalItems = trips.reduce((sum, t) => sum + t.items.length, 0)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="font-display text-2xl font-extrabold text-foreground">Profile</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-2">
        {/* identity */}
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-display text-lg font-extrabold text-primary-foreground">
            AL
          </div>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-card-foreground">Alex Lindberg</p>
            <p className="text-sm text-muted-foreground">alex@example.com</p>
          </div>
        </div>

        {/* stats */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card px-4 py-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-primary">
              <Plane className="h-4 w-4" />
            </div>
            <p className="font-display text-2xl font-extrabold text-foreground">{totalTrips}</p>
            <p className="text-xs text-muted-foreground">trips planned</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-primary">
              <Luggage className="h-4 w-4" />
            </div>
            <p className="font-display text-2xl font-extrabold text-foreground">{totalItems}</p>
            <p className="text-xs text-muted-foreground">items packed</p>
          </div>
        </div>

        {/* travelers */}
        <SectionTitle>Travelers</SectionTitle>
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
          <Row
            icon={<Users className="h-4 w-4" />}
            label="You"
            hint="Adult"
          />
          <Divider />
          <Row icon={<Users className="h-4 w-4" />} label="Jordan" hint="Adult" />
          <Divider />
          <Row icon={<Users className="h-4 w-4" />} label="Mia" hint="Child · 6" />
          <Divider />
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-primary transition-colors active:bg-muted"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
              <Plus className="h-4 w-4" />
            </span>
            Add a traveler
          </button>
        </div>

        {/* packing preferences */}
        <SectionTitle>Packing preferences</SectionTitle>
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
          <ToggleRow
            icon={<Sparkles className="h-4 w-4" />}
            label="Smart quantities"
            hint="Let Trove scale amounts to trip length"
            checked={smartQty}
            onChange={setSmartQty}
          />
          <Divider />
          <ToggleRow
            icon={<Ruler className="h-4 w-4" />}
            label="Metric units"
            hint={metric ? "Celsius, kilometers" : "Fahrenheit, miles"}
            checked={metric}
            onChange={setMetric}
          />
          <Divider />
          <ToggleRow
            icon={<Bell className="h-4 w-4" />}
            label="Packing reminders"
            hint="Get a nudge before each trip"
            checked={reminders}
            onChange={setReminders}
          />
        </div>

        {/* general */}
        <SectionTitle>General</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <LinkRow icon={<Globe className="h-4 w-4" />} label="Language & region" hint="English (UK)" />
          <Divider />
          <LinkRow icon={<Luggage className="h-4 w-4" />} label="Default packing style" hint="Balanced" />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Trove · Prototype v1.0</p>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="mx-4 h-px bg-border" />
}

function Row({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-card-foreground">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

function LinkRow({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-card-foreground">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-card-foreground">{label}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
          (checked ? "bg-primary" : "bg-muted-foreground/30")
        }
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform " +
            (checked ? "translate-x-[22px]" : "translate-x-0.5")
          }
        />
      </button>
    </div>
  )
}
