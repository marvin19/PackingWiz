"use client"

import { useState } from "react"
import {
  Baby,
  MapPin,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  WashingMachine,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { ScreenHeader } from "@/components/screen-header"
import { ProgressBar } from "@/components/progress"
import { OptionCard, Chip, RadioRow } from "@/components/select-controls"
import { accommodationIcon, bagIcon, tripTypeIcon } from "@/components/icons"
import { durationDays, formatAge } from "@/lib/dates"
import {
  ACCOMMODATIONS,
  ACTIVITIES,
  BAG_TYPES,
  LAUNDRY_OPTIONS,
  TRIP_TYPES,
} from "@/lib/mock-data"
import type { Bag, BagType, Traveler, TravelerRole } from "@/lib/types"
import { cn } from "@/lib/utils"

const DESTINATION_SUGGESTIONS = [
  { destination: "Tokyo & Kyoto", country: "Japan" },
  { destination: "Lisbon", country: "Portugal" },
  { destination: "Chamonix", country: "France" },
  { destination: "Bali", country: "Indonesia" },
]

// birth dates chosen so ages read naturally for the current year
const TRAVELER_PRESETS: { label: string; travelers: Traveler[] }[] = [
  { label: "Solo", travelers: [{ id: "t-you", name: "You", role: "Adult" }] },
  {
    label: "Partner",
    travelers: [
      { id: "t-you", name: "You", role: "Adult" },
      { id: "t-partner", name: "Partner", role: "Adult" },
    ],
  },
  {
    label: "Family",
    travelers: [
      { id: "t-anna", name: "Anna", role: "Adult" },
      { id: "t-martin", name: "Martin", role: "Adult" },
      { id: "t-emma", name: "Emma", role: "Child", birthDate: "2011-03-04" },
      { id: "t-oliver", name: "Oliver", role: "Child", birthDate: "2024-05-10" },
    ],
  },
]

const STEP_TITLES = [
  "Where are you going?",
  "What kind of trip?",
  "What will you do?",
  "Where are you staying?",
  "Who's coming?",
  "What are you packing in?",
  "Anything else?",
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block px-1 text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  )
}

export function CreateTripScreen() {
  const { draft, setDraft, navigate } = useStore()
  const [step, setStep] = useState(0)
  const [addingTraveler, setAddingTraveler] = useState(false)
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState<TravelerRole>("Adult")
  const [newBirth, setNewBirth] = useState("")

  const totalSteps = STEP_TITLES.length
  const days = durationDays(draft.startDate, draft.endDate)

  const canContinue = (() => {
    if (step === 0) return draft.destination.trim() !== "" && draft.startDate !== "" && draft.endDate !== ""
    if (step === 1) return draft.types.length > 0
    if (step === 3) return draft.accommodation !== null && draft.laundry !== null
    if (step === 4) return draft.travelers.length > 0
    return true
  })()

  const back = () => {
    if (step === 0) navigate("home")
    else setStep((s) => s - 1)
  }

  const next = () => {
    if (step === totalSteps - 1) navigate("summary")
    else setStep((s) => s + 1)
  }

  const toggleType = (id: (typeof TRIP_TYPES)[number]["id"]) => {
    setDraft({
      types: draft.types.includes(id)
        ? draft.types.filter((x) => x !== id)
        : [...draft.types, id],
    })
  }

  const toggleActivity = (a: string) => {
    setDraft({
      activities: draft.activities.includes(a)
        ? draft.activities.filter((x) => x !== a)
        : [...draft.activities, a],
    })
  }

  const addTraveler = () => {
    const name = newName.trim()
    if (!name) return
    const base: Traveler = { id: `t-${Date.now()}`, name, role: newRole }
    if (newRole === "Child") base.birthDate = newBirth || undefined
    setDraft({ travelers: [...draft.travelers, base] })
    setNewName("")
    setNewRole("Adult")
    setNewBirth("")
    setAddingTraveler(false)
  }

  const removeTraveler = (id: string) => {
    setDraft({
      travelers: draft.travelers.filter((t) => t.id !== id),
      // unassign any bags owned by the removed traveler
      bags: draft.bags.map((b) => (b.ownerId === id ? { ...b, ownerId: null } : b)),
    })
  }

  const addBag = (type: BagType) => {
    const label = BAG_TYPES.find((b) => b.id === type)?.label ?? "Bag"
    const bag: Bag = { id: `bag-${Date.now()}`, name: label, type, ownerId: null }
    setDraft({ bags: [...draft.bags, bag] })
  }

  const updateBag = (id: string, patch: Partial<Bag>) => {
    setDraft({ bags: draft.bags.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
  }

  const removeBag = (id: string) => {
    setDraft({ bags: draft.bags.filter((b) => b.id !== id) })
  }

  const customActivities = draft.activities.filter((a) => !ACTIVITIES.includes(a))

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="New trip" onBack={back} />
      <div className="px-5 pb-1 pt-1">
        <ProgressBar value={((step + 1) / totalSteps) * 100} />
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Step {step + 1} of {totalSteps}
        </p>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-3">
        <h2 className="mb-5 font-display text-2xl font-bold text-foreground text-balance">
          {STEP_TITLES[step]}
        </h2>

        {step === 0 && (
          <div className="space-y-5">
            <Field label="Destination">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={draft.destination}
                  onChange={(e) => setDraft({ destination: e.target.value })}
                  placeholder="Search a city or country"
                  className="w-full rounded-2xl border border-border bg-card py-3.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {DESTINATION_SUGGESTIONS.map((s) => (
                  <button
                    key={s.destination}
                    type="button"
                    onClick={() => setDraft({ destination: s.destination, country: s.country })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground active:bg-muted"
                  >
                    <MapPin className="h-3 w-3 text-primary" />
                    {s.destination}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Departure">
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ startDate: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-card px-3.5 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </Field>
              <Field label="Return">
                <input
                  type="date"
                  value={draft.endDate}
                  min={draft.startDate || undefined}
                  onChange={(e) => setDraft({ endDate: e.target.value })}
                  className="w-full rounded-2xl border border-border bg-card px-3.5 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </Field>
            </div>
            {days > 0 && (
              <div className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground">
                Trip duration: {days} {days === 1 ? "day" : "days"}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="-mt-2 text-sm text-muted-foreground">
              Pick everything that fits — you can mix, like outdoor and beach.
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {TRIP_TYPES.map((t) => (
                <OptionCard
                  key={t.id}
                  label={t.label}
                  icon={tripTypeIcon(t.id)}
                  selected={draft.types.includes(t.id)}
                  onClick={() => toggleType(t.id)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="-mt-2 text-sm text-muted-foreground">
              Pick anything that applies — this helps us pack for what you&apos;ll actually do.
            </p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  selected={draft.activities.includes(a)}
                  onClick={() => toggleActivity(a)}
                />
              ))}
              {customActivities.map((a) => (
                <Chip key={a} label={a} selected onClick={() => toggleActivity(a)} />
              ))}
            </div>
            <AddCustomActivity onAdd={(a) => setDraft({ activities: [...draft.activities, a] })} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="mb-3 px-1 text-sm font-semibold text-foreground">Accommodation</p>
              <div className="grid grid-cols-2 gap-2.5">
                {ACCOMMODATIONS.map((a) => (
                  <OptionCard
                    key={a.id}
                    label={a.label}
                    icon={accommodationIcon(a.id)}
                    selected={draft.accommodation === a.id}
                    onClick={() => setDraft({ accommodation: a.id })}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
                <WashingMachine className="h-4 w-4 text-primary" />
                Will you be able to wash clothes?
              </p>
              <p className="mb-3 px-1 text-xs text-muted-foreground">
                We use this to decide how much clothing you really need.
              </p>
              <div className="space-y-2">
                {LAUNDRY_OPTIONS.map((o) => (
                  <RadioRow
                    key={o.id}
                    label={o.label}
                    selected={draft.laundry === o.id}
                    onClick={() => setDraft({ laundry: o.id })}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {TRAVELER_PRESETS.map((p) => {
                const active =
                  draft.travelers.length === p.travelers.length &&
                  draft.travelers.every((t, i) => t.name === p.travelers[i]?.name)
                return (
                  <Chip
                    key={p.label}
                    label={p.label}
                    selected={active}
                    onClick={() => setDraft({ travelers: p.travelers })}
                  />
                )
              })}
            </div>

            <div className="space-y-2">
              {draft.travelers.map((t) => {
                const Icon = t.role === "Child" ? Baby : User
                const sub =
                  t.role === "Child"
                    ? `Child${formatAge(t) ? ` · ${formatAge(t)}` : ""}`
                    : "Adult"
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    {draft.travelers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTraveler(t.id)}
                        aria-label={`Remove ${t.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {addingTraveler ? (
              <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  {(["Adult", "Child"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                        newRole === r
                          ? "border-primary bg-accent text-foreground"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {newRole === "Child" && (
                  <div className="space-y-1">
                    <label className="block px-1 text-xs font-semibold text-muted-foreground">
                      Date of birth
                    </label>
                    <input
                      type="date"
                      value={newBirth}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setNewBirth(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <p className="px-1 text-[11px] text-muted-foreground">
                      Age updates on its own, so packing stays right for every trip.
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingTraveler(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground active:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addTraveler}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:opacity-90"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingTraveler(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-primary active:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Add traveler
              </button>
            )}
            <div className="flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-xs text-muted-foreground">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              We tailor items to each person — kids get age-appropriate gear based on their age.
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <p className="-mt-2 text-sm text-muted-foreground">
              Add your bags and link each to whoever&apos;s carrying it. Optional, but it makes the
              list easier to split.
            </p>

            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quick add
              </p>
              <div className="flex flex-wrap gap-2">
                {BAG_TYPES.map((b) => {
                  const Icon = bagIcon(b.id)
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => addBag(b.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground active:bg-muted"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {b.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {draft.bags.length > 0 && (
              <div className="space-y-2.5">
                {draft.bags.map((bag) => {
                  const Icon = bagIcon(bag.type)
                  return (
                    <div
                      key={bag.id}
                      className="space-y-2.5 rounded-2xl border border-border bg-card p-3.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <input
                          value={bag.name}
                          onChange={(e) => updateBag(bag.id, { name: e.target.value })}
                          placeholder="Name this bag"
                          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 text-sm font-medium text-foreground outline-none focus:border-border focus:bg-background"
                        />
                        <button
                          type="button"
                          onClick={() => removeBag(bag.id)}
                          aria-label={`Remove ${bag.name}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <OwnerChip
                          label="Shared"
                          active={bag.ownerId === null}
                          onClick={() => updateBag(bag.id, { ownerId: null })}
                        />
                        {draft.travelers.map((t) => (
                          <OwnerChip
                            key={t.id}
                            label={t.name}
                            active={bag.ownerId === t.id}
                            onClick={() => updateBag(bag.id, { ownerId: t.id })}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {draft.bags.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                No bags yet — tap one above, or skip this step.
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <p className="-mt-2 text-sm text-muted-foreground">
              Add anything that would change what you pack. Optional, but it helps.
            </p>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft({ note: e.target.value })}
              rows={5}
              placeholder="I'm running a half marathon, we'll have one nice dinner, and I don't want to overpack."
              className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-card px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={next}
          disabled={!canContinue}
          className="w-full rounded-2xl bg-primary py-3.5 text-center text-sm font-bold text-primary-foreground transition-opacity active:opacity-90 disabled:opacity-40"
        >
          {step === totalSteps - 1 ? "Review trip" : "Continue"}
        </button>
      </div>
    </div>
  )
}

function OwnerChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
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

function AddCustomActivity({ onAdd }: { onAdd: (a: string) => void }) {
  const [value, setValue] = useState("")
  const submit = () => {
    const v = value.trim()
    if (!v) return
    onAdd(v)
    setValue("")
  }
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="Add your own activity"
        className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
      />
      <button
        type="button"
        onClick={submit}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground active:opacity-90"
        aria-label="Add activity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
