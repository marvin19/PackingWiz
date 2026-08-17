"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { initialTrips } from "./mock-data"
import { buildTripFromDraft } from "./generate"
import type {
  AccommodationId,
  Bag,
  LaundryOption,
  PackingCategory,
  PackingItem,
  Traveler,
  Trip,
  TripTypeId,
} from "./types"

export type Screen =
  | "home"
  | "create"
  | "summary"
  | "generating"
  | "packing"
  | "overview"
  | "profile"

export type Tab = "trips" | "pack" | "profile"

export interface TripDraft {
  destination: string
  country: string
  startDate: string
  endDate: string
  types: TripTypeId[]
  activities: string[]
  accommodation: AccommodationId | null
  laundry: LaundryOption | null
  travelers: Traveler[]
  bags: Bag[]
  note: string
}

const emptyDraft: TripDraft = {
  destination: "",
  country: "",
  startDate: "",
  endDate: "",
  types: [],
  activities: [],
  accommodation: null,
  laundry: null,
  travelers: [{ id: "t-you", name: "You", role: "Adult" }],
  bags: [],
  note: "",
}

interface StoreValue {
  trips: Trip[]
  screen: Screen
  activeTripId: string | null
  activeTrip: Trip | null
  draft: TripDraft
  navigate: (screen: Screen) => void
  goToTab: (tab: Tab) => void
  activeTab: Tab
  openTrip: (id: string) => void
  setDraft: (patch: Partial<TripDraft>) => void
  resetDraft: () => void
  startCreate: () => void
  commitDraftTrip: () => string
  // packing interactions
  togglePacked: (itemId: string) => void
  setQuantity: (itemId: string, quantity: number) => void
  toggleNeedToBuy: (itemId: string) => void
  assignItem: (itemId: string, travelerId: string | null) => void
  moveItem: (itemId: string, category: PackingCategory) => void
  deleteItem: (itemId: string) => void
  addItem: (name: string, category: PackingCategory) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [screen, setScreen] = useState<Screen>("home")
  const [activeTab, setActiveTab] = useState<Tab>("trips")
  const [activeTripId, setActiveTripId] = useState<string | null>("tokyo-kyoto")
  const [draft, setDraftState] = useState<TripDraft>(emptyDraft)

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === activeTripId) ?? null,
    [trips, activeTripId],
  )

  const navigate = (s: Screen) => setScreen(s)

  const goToTab = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === "trips") setScreen("home")
    if (tab === "pack") setScreen("packing")
    if (tab === "profile") setScreen("profile")
  }

  const openTrip = (id: string) => {
    setActiveTripId(id)
    setActiveTab("pack")
    setScreen("packing")
  }

  const setDraft = (patch: Partial<TripDraft>) =>
    setDraftState((prev) => ({ ...prev, ...patch }))

  const resetDraft = () => setDraftState(emptyDraft)

  const startCreate = () => {
    resetDraft()
    setScreen("create")
  }

  const commitDraftTrip = () => {
    const trip = buildTripFromDraft(draft)
    setTrips((prev) => [trip, ...prev])
    setActiveTripId(trip.id)
    setActiveTab("pack")
    return trip.id
  }

  const updateActiveItems = (
    updater: (items: PackingItem[]) => PackingItem[],
  ) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === activeTripId ? { ...t, items: updater(t.items) } : t,
      ),
    )
  }

  const togglePacked = (itemId: string) =>
    updateActiveItems((items) =>
      items.map((i) => (i.id === itemId ? { ...i, packed: !i.packed } : i)),
    )

  const setQuantity = (itemId: string, quantity: number) =>
    updateActiveItems((items) =>
      items.map((i) =>
        i.id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    )

  const toggleNeedToBuy = (itemId: string) =>
    updateActiveItems((items) =>
      items.map((i) =>
        i.id === itemId ? { ...i, needToBuy: !i.needToBuy } : i,
      ),
    )

  const assignItem = (itemId: string, travelerId: string | null) =>
    updateActiveItems((items) =>
      items.map((i) =>
        i.id === itemId ? { ...i, assignedTo: travelerId } : i,
      ),
    )

  const moveItem = (itemId: string, category: PackingCategory) =>
    updateActiveItems((items) =>
      items.map((i) => (i.id === itemId ? { ...i, category } : i)),
    )

  const deleteItem = (itemId: string) =>
    updateActiveItems((items) => items.filter((i) => i.id !== itemId))

  const addItem = (name: string, category: PackingCategory) =>
    updateActiveItems((items) => [
      ...items,
      {
        id: `custom-${Date.now()}`,
        name,
        quantity: 1,
        category,
        packed: false,
        needToBuy: false,
        assignedTo: null,
      },
    ])

  const value: StoreValue = {
    trips,
    screen,
    activeTripId,
    activeTrip,
    draft,
    navigate,
    goToTab,
    activeTab,
    openTrip,
    setDraft,
    resetDraft,
    startCreate,
    commitDraftTrip,
    togglePacked,
    setQuantity,
    toggleNeedToBuy,
    assignItem,
    moveItem,
    deleteItem,
    addItem,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}

export function packingStats(trip: Trip | null) {
  if (!trip) return { packed: 0, total: 0, pct: 0 }
  const packed = trip.items.filter((i) => i.packed).length
  const total = trip.items.length
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100)
  return { packed, total, pct }
}
