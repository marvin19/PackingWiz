export type TravelerRole = "Adult" | "Child"

export interface Traveler {
  id: string
  name: string
  role: TravelerRole
  age?: number
  birthDate?: string // ISO yyyy-mm-dd; when set, age is derived from it
}

export type BagType =
  | "checked"
  | "carryon"
  | "backpack"
  | "duffel"
  | "personal"
  | "other"

export interface Bag {
  id: string
  name: string
  type: BagType
  ownerId: string | null // traveler id, or null for shared
}

export type TripTypeId =
  | "vacation"
  | "business"
  | "city"
  | "beach"
  | "outdoor"
  | "training"
  | "race"
  | "ski"
  | "camping"
  | "family"
  | "other"

export type AccommodationId =
  | "hotel"
  | "apartment"
  | "hostel"
  | "camping"
  | "friends"
  | "other"

export type LaundryOption = "yes" | "no" | "unsure"

export type PackingCategory =
  | "Essentials"
  | "Clothing"
  | "Shoes"
  | "Toiletries"
  | "Electronics"
  | "Activities"
  | "Weather"

export interface PackingItem {
  id: string
  name: string
  quantity: number
  category: PackingCategory
  packed: boolean
  needToBuy: boolean
  assignedTo: string | null // traveler id
  note?: string
}

export type WeatherMode = "forecast" | "climate"

export interface WeatherDay {
  label: string
  icon: "sun" | "cloud" | "rain" | "partly" | "snow"
  high: number
  low: number
}

export interface TripWeather {
  mode: WeatherMode
  summary: string
  detail: string
  high: number
  low: number
  rainfall?: string
  conditions?: string
  days?: WeatherDay[]
}

export interface Trip {
  id: string
  title: string
  destination: string
  country: string
  startDate: string // ISO
  endDate: string // ISO
  types: TripTypeId[]
  activities: string[]
  accommodation: AccommodationId
  laundry: LaundryOption
  travelers: Traveler[]
  bags: Bag[]
  note: string
  weather: TripWeather
  items: PackingItem[]
  insights: string[]
  generated: boolean
  status: "upcoming" | "past"
  image?: string
}
