"use client"

import Image from "next/image"
import { ArrowRight, MapPin, Plus } from "lucide-react"
import { useStore, packingStats } from "@/lib/store"
import { BrandMark } from "@/components/brand"
import { ProgressBar } from "@/components/progress"
import { tripTypeIcon } from "@/components/icons"
import { durationDays, formatRange } from "@/lib/dates"
import { TRIP_TYPES } from "@/lib/mock-data"
import type { Trip } from "@/lib/types"

function typeLabel(trip: Trip) {
  return TRIP_TYPES.find((t) => t.id === trip.types[0])?.label ?? "Trip"
}

function UpcomingCard({ trip }: { trip: Trip }) {
  const { openTrip } = useStore()
  const stats = packingStats(trip)
  const days = durationDays(trip.startDate, trip.endDate)
  const TypeIcon = tripTypeIcon(trip.types[0] ?? "vacation")

  return (
    <button
      type="button"
      onClick={() => openTrip(trip.id)}
      className="group w-full overflow-hidden rounded-3xl border border-border bg-card text-left shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="relative h-40 w-full">
        {trip.image && (
          <Image
            src={trip.image}
            alt={`${trip.destination}, ${trip.country}`}
            fill
            sizes="440px"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/5 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur">
          <TypeIcon className="h-3.5 w-3.5 text-primary" />
          {typeLabel(trip)}
        </div>
        <div className="absolute bottom-3 left-4 right-4 text-primary-foreground">
          <h3 className="font-display text-2xl font-bold leading-tight text-white text-balance">
            {trip.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/85">
            <MapPin className="h-3.5 w-3.5" />
            {trip.country}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {formatRange(trip.startDate, trip.endDate)}
          </span>
          <span className="text-muted-foreground">{days} days</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Packing progress</span>
            <span className="font-semibold text-foreground">
              {stats.packed} / {stats.total} packed
            </span>
          </div>
          <ProgressBar value={stats.pct} />
        </div>
      </div>
    </button>
  )
}

function PastCard({ trip }: { trip: Trip }) {
  const { openTrip } = useStore()
  const days = durationDays(trip.startDate, trip.endDate)
  return (
    <button
      type="button"
      onClick={() => openTrip(trip.id)}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-left transition-transform active:scale-[0.99]"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {trip.image && (
          <Image src={trip.image} alt={trip.destination} fill sizes="56px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{trip.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {formatRange(trip.startDate, trip.endDate)} · {days} days
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function HomeScreen() {
  const { trips, startCreate } = useStore()
  const upcoming = trips.filter((t) => t.status === "upcoming")
  const past = trips.filter((t) => t.status === "past")

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-sm text-muted-foreground">Good morning, Anna</p>
            <p className="font-display text-lg font-bold leading-tight text-foreground">
              Where to next?
            </p>
          </div>
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        <button
          type="button"
          onClick={startCreate}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-primary p-4 text-left text-primary-foreground shadow-sm transition-transform active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className="flex-1">
            <span className="block font-display text-base font-bold">Plan a new trip</span>
            <span className="block text-sm text-primary-foreground/80">
              Tell us where you&apos;re going — we&apos;ll pack it
            </span>
          </span>
          <ArrowRight className="h-5 w-5 text-primary-foreground/80" />
        </button>

        <section className="mt-7">
          <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming
          </h2>
          <div className="space-y-4">
            {upcoming.map((trip) => (
              <UpcomingCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Previous trips
          </h2>
          <div className="space-y-2.5">
            {past.map((trip) => (
              <PastCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
