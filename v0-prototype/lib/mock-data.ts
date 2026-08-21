import type {
  AccommodationId,
  BagType,
  LaundryOption,
  PackingItem,
  PetSpecies,
  Trip,
  TripTypeId,
} from "./types"

export const TRIP_TYPES: { id: TripTypeId; label: string; icon: string }[] = [
  { id: "vacation", label: "Vacation", icon: "palm" },
  { id: "business", label: "Business", icon: "briefcase" },
  { id: "city", label: "City break", icon: "building" },
  { id: "beach", label: "Beach", icon: "umbrella" },
  { id: "outdoor", label: "Outdoor", icon: "mountain" },
  { id: "training", label: "Training", icon: "dumbbell" },
  { id: "race", label: "Race", icon: "medal" },
  { id: "ski", label: "Ski", icon: "snowflake" },
  { id: "camping", label: "Camping", icon: "tent" },
  { id: "family", label: "Family", icon: "users" },
  { id: "other", label: "Other", icon: "sparkles" },
]

export const ACTIVITIES = [
  "Sightseeing",
  "Hiking",
  "Running",
  "Half marathon",
  "Gym",
  "Swimming",
  "Beach",
  "Cycling",
  "Skiing",
  "Business meetings",
  "Formal dinner",
  "Nightlife",
]

export const ACCOMMODATIONS: { id: AccommodationId; label: string; icon: string }[] = [
  { id: "hotel", label: "Hotel", icon: "hotel" },
  { id: "apartment", label: "Apartment / Airbnb", icon: "home" },
  { id: "hostel", label: "Hostel", icon: "bunk" },
  { id: "camping", label: "Camping", icon: "tent" },
  { id: "friends", label: "Friends / family", icon: "heart" },
  { id: "other", label: "Other", icon: "dots" },
]

export const LAUNDRY_OPTIONS: { id: LaundryOption; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unsure", label: "Not sure" },
]

export const BAG_TYPES: { id: BagType; label: string; icon: string }[] = [
  { id: "checked", label: "Checked suitcase", icon: "luggage" },
  { id: "carryon", label: "Carry-on", icon: "luggage" },
  { id: "backpack", label: "Backpack", icon: "backpack" },
  { id: "duffel", label: "Duffel bag", icon: "briefcase" },
  { id: "personal", label: "Personal item", icon: "briefcase" },
  { id: "other", label: "Other", icon: "dots" },
]

export const PET_SPECIES: { id: PetSpecies; label: string }[] = [
  { id: "dog", label: "Dog" },
  { id: "cat", label: "Cat" },
  { id: "other", label: "Other" },
]

export const CATEGORY_ORDER = [
  "Essentials",
  "Clothing",
  "Shoes",
  "Toiletries",
  "Electronics",
  "Activities",
  "Weather",
] as const

let idCounter = 0
const uid = (prefix = "item") => `${prefix}-${idCounter++}`

function makeItem(
  name: string,
  category: PackingItem["category"],
  opts: Partial<PackingItem> = {},
): PackingItem {
  return {
    id: uid(),
    name,
    quantity: opts.quantity ?? 1,
    category,
    packed: opts.packed ?? false,
    needToBuy: opts.needToBuy ?? false,
    assignedTo: opts.assignedTo ?? null,
    note: opts.note,
  }
}

const tokyoItems: PackingItem[] = [
  // Essentials
  makeItem("Passport", "Essentials", { packed: true }),
  makeItem("Wallet & cards", "Essentials", { packed: true }),
  makeItem("Travel insurance", "Essentials", {
    packed: true,
    note: "Keep a digital and printed copy in case you need it at a clinic.",
  }),
  makeItem("Medication", "Essentials", {
    note: "Bring enough for 14 days — some common meds are restricted in Japan.",
  }),
  makeItem("Cash (JPY)", "Essentials", {
    note: "Japan is still cash-friendly. Many small restaurants are cash only.",
  }),

  // Clothing
  makeItem("T-shirts", "Clothing", { quantity: 6, packed: true }),
  makeItem("Trousers", "Clothing", { quantity: 2, packed: true }),
  makeItem("Lightweight jacket", "Clothing", {
    quantity: 1,
    note: "October evenings in Tokyo can dip to 15°C.",
  }),
  makeItem("Underwear", "Clothing", { quantity: 7, packed: true }),
  makeItem("Socks", "Clothing", { quantity: 7 }),
  makeItem("Smart outfit", "Clothing", {
    quantity: 1,
    assignedTo: "t-martin",
    note: "For your nice dinner — some Tokyo restaurants have a dress code.",
  }),
  makeItem("Sleepwear", "Clothing", { quantity: 1 }),

  // Shoes
  makeItem("Walking shoes", "Shoes", {
    packed: true,
    note: "You'll walk a lot sightseeing — comfort matters more than style.",
  }),
  makeItem("Running shoes", "Shoes", {
    assignedTo: "t-anna",
    note: "For easy runs and shakeouts before race day.",
  }),
  makeItem("Smart shoes", "Shoes", { assignedTo: "t-martin" }),

  // Toiletries
  makeItem("Toothbrush & paste", "Toiletries", { packed: true }),
  makeItem("Deodorant", "Toiletries", { packed: true }),
  makeItem("Sunscreen", "Toiletries", {
    note: "UV stays moderate in October — useful for long days outdoors.",
  }),
  makeItem("Shampoo & body wash", "Toiletries", {
    note: "Most Tokyo hotels provide these, so pack travel sizes only.",
  }),

  // Electronics
  makeItem("Phone charger", "Electronics", { packed: true }),
  makeItem("Power bank", "Electronics", {
    note: "Long sightseeing days drain your phone from maps and photos.",
  }),
  makeItem("Travel adapter", "Electronics", {
    needToBuy: true,
    note: "Japan uses Type A plugs at 100V — bring an adapter.",
  }),
  makeItem("Headphones", "Electronics", { packed: true }),

  // Activities
  makeItem("Running shorts", "Activities", { quantity: 2, assignedTo: "t-anna" }),
  makeItem("Running top", "Activities", { quantity: 2, assignedTo: "t-anna" }),
  makeItem("Race shoes", "Activities", {
    assignedTo: "t-anna",
    note: "Added because you're running a half marathon.",
  }),
  makeItem("Running watch", "Activities", { assignedTo: "t-anna" }),
  makeItem("Energy gels", "Activities", {
    quantity: 4,
    needToBuy: true,
    assignedTo: "t-anna",
    note: "Race-day fuel — easier to bring your own than find on course.",
  }),
  makeItem("Race confirmation", "Activities", {
    assignedTo: "t-anna",
    note: "Bring your bib pickup confirmation and photo ID.",
  }),

  // Weather
  makeItem("Compact umbrella", "Weather", {
    needToBuy: true,
    note: "Rain is common in Tokyo during October.",
  }),
  makeItem("Light rain jacket", "Weather", {
    note: "Several rainy days are expected across your trip.",
  }),
  makeItem("Sunglasses", "Weather", { packed: true }),
]

export const tokyoTrip: Trip = {
  id: "tokyo-kyoto",
  title: "Tokyo & Kyoto",
  destination: "Tokyo & Kyoto",
  country: "Japan",
  startDate: "2026-10-12",
  endDate: "2026-10-26",
  types: ["vacation", "outdoor"],
  activities: ["Sightseeing", "Hiking", "Running", "Half marathon", "Nice dinner"],
  accommodation: "hotel",
  laundry: "yes",
  travelers: [
    { id: "t-anna", name: "Anna", role: "Adult" },
    { id: "t-martin", name: "Martin", role: "Adult" },
  ],
  bags: [
    { id: "bag-anna", name: "Anna's carry-on", type: "carryon", ownerId: "t-anna" },
    { id: "bag-martin", name: "Martin's backpack", type: "backpack", ownerId: "t-martin" },
    { id: "bag-shared", name: "Shared checked suitcase", type: "checked", ownerId: null },
  ],
  note: "We're running a half marathon during the trip and want to pack relatively light.",
  weather: {
    mode: "climate",
    summary: "Typical October weather",
    detail:
      "Your trip is too far away for an accurate forecast, so we're using typical weather for this destination and time of year.",
    high: 22,
    low: 15,
    rainfall: "Moderate",
    conditions: "Mild with occasional rain",
    days: [
      { label: "Typical high", icon: "partly", high: 22, low: 15 },
    ],
  },
  items: tokyoItems,
  insights: [
    "Your hotel has laundry available, so we've reduced the amount of clothing you need for 14 days.",
    "Rain is common during your trip, so we've added a compact umbrella and a light rain jacket.",
    "Because you're running a half marathon, we've added race-day essentials like gels and your race confirmation.",
    "You mentioned packing light, so we kept clothing to versatile layers you can mix and match.",
  ],
  generated: true,
  status: "upcoming",
  image: "/trips/tokyo.png",
}

export const lisbonTrip: Trip = {
  id: "lisbon",
  title: "Lisbon City Break",
  destination: "Lisbon",
  country: "Portugal",
  startDate: "2026-05-08",
  endDate: "2026-05-12",
  types: ["city"],
  activities: ["Sightseeing", "Nightlife"],
  accommodation: "apartment",
  laundry: "no",
  travelers: [
    { id: "t-anna", name: "Anna", role: "Adult" },
    { id: "t-martin", name: "Martin", role: "Adult" },
  ],
  bags: [
    { id: "bag-l-1", name: "Cabin bag", type: "carryon", ownerId: "t-anna" },
    { id: "bag-l-2", name: "Cabin bag", type: "carryon", ownerId: "t-martin" },
  ],
  note: "",
  weather: {
    mode: "forecast",
    summary: "Warm and sunny",
    detail: "A dry, bright few days perfect for exploring on foot.",
    high: 24,
    low: 16,
  },
  items: [],
  insights: [],
  generated: true,
  status: "past",
  image: "/trips/lisbon.png",
}

export const mallorcaTrip: Trip = {
  id: "mallorca",
  title: "Mallorca Beach",
  destination: "Mallorca",
  country: "Spain",
  startDate: "2025-07-19",
  endDate: "2025-07-28",
  types: ["beach", "vacation"],
  activities: ["Beach", "Swimming", "Cycling"],
  accommodation: "hotel",
  laundry: "yes",
  travelers: [
    { id: "t-anna", name: "Anna", role: "Adult" },
    { id: "t-martin", name: "Martin", role: "Adult" },
  ],
  bags: [
    { id: "bag-m-1", name: "Beach duffel", type: "duffel", ownerId: null },
    { id: "bag-m-2", name: "Checked suitcase", type: "checked", ownerId: null },
  ],
  note: "",
  weather: {
    mode: "forecast",
    summary: "Hot and dry",
    detail: "Classic Mediterranean summer — plenty of beach days.",
    high: 31,
    low: 22,
  },
  items: [],
  insights: [],
  generated: true,
  status: "past",
  image: "/trips/mallorca.png",
}

export const initialTrips: Trip[] = [tokyoTrip, lisbonTrip, mallorcaTrip]
