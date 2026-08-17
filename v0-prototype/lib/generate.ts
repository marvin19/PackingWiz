import { durationDays, parseDate, resolveTravelerAge } from "./dates"
import type { PackingItem, Trip, TripWeather } from "./types"
import type { TripDraft } from "./store"

let gid = 0
function item(
  name: string,
  category: PackingItem["category"],
  opts: Partial<PackingItem> = {},
): PackingItem {
  return {
    id: `gen-${gid++}`,
    name,
    quantity: opts.quantity ?? 1,
    category,
    packed: false,
    needToBuy: opts.needToBuy ?? false,
    assignedTo: opts.assignedTo ?? null,
    note: opts.note,
  }
}

function has(list: string[], ...needles: string[]) {
  const lower = list.map((s) => s.toLowerCase())
  return needles.some((n) => lower.some((l) => l.includes(n.toLowerCase())))
}

type Climate = "cold" | "hot" | "mild"

const COLD_PLACES = [
  "chamonix",
  "alps",
  "aspen",
  "whistler",
  "reykjavik",
  "iceland",
  "zermatt",
  "hokkaido",
  "tromso",
  "lapland",
  "banff",
  "st moritz",
  "st. moritz",
]
const HOT_PLACES = [
  "bali",
  "mallorca",
  "ibiza",
  "cancun",
  "phuket",
  "maldives",
  "dubai",
  "thailand",
  "mexico",
  "hawaii",
  "miami",
  "marrakech",
]

// Decide the overall climate for a trip from its types, activities and destination.
export function tripClimate(draft: TripDraft): Climate {
  const place = `${draft.destination} ${draft.country}`.toLowerCase()
  const types = draft.types
  if (types.includes("ski") || has(draft.activities, "ski") || COLD_PLACES.some((p) => place.includes(p)))
    return "cold"
  if (
    types.includes("beach") ||
    has(draft.activities, "swim", "beach") ||
    HOT_PLACES.some((p) => place.includes(p))
  )
    return "hot"
  return "mild"
}

export function buildWeather(draft: TripDraft): TripWeather {
  const daysAway = draft.startDate
    ? Math.round(
        (parseDate(draft.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : 0
  const climate = daysAway > 14
  const kind = tripClimate(draft)

  const profile = {
    cold: {
      summary: "Cold & snowy",
      detail: "Below-freezing days with snow — pack proper insulation and waterproof layers.",
      high: -2,
      low: -9,
      rainfall: "Snow",
      conditions: "Cold with regular snowfall",
      days: [
        { label: "Mon", icon: "snow" as const, high: -1, low: -8 },
        { label: "Tue", icon: "snow" as const, high: -3, low: -10 },
        { label: "Wed", icon: "cloud" as const, high: 0, low: -6 },
        { label: "Thu", icon: "snow" as const, high: -2, low: -9 },
        { label: "Fri", icon: "sun" as const, high: 1, low: -5 },
      ],
    },
    hot: {
      summary: "Hot & sunny",
      detail: "Hot, sunny days throughout — pack light, breathable clothing and sun protection.",
      high: 31,
      low: 24,
      rainfall: "Low",
      conditions: "Hot and mostly sunny",
      days: [
        { label: "Mon", icon: "sun" as const, high: 31, low: 24 },
        { label: "Tue", icon: "sun" as const, high: 32, low: 25 },
        { label: "Wed", icon: "partly" as const, high: 30, low: 24 },
        { label: "Thu", icon: "sun" as const, high: 31, low: 24 },
        { label: "Fri", icon: "sun" as const, high: 33, low: 25 },
      ],
    },
    mild: {
      summary: "Mixed sun and rain",
      detail: "Rain expected on several days — pack layers you can adjust.",
      high: 23,
      low: 17,
      rainfall: "Moderate",
      conditions: "Mild with occasional rain",
      days: [
        { label: "Mon", icon: "partly" as const, high: 22, low: 16 },
        { label: "Tue", icon: "rain" as const, high: 19, low: 15 },
        { label: "Wed", icon: "sun" as const, high: 23, low: 17 },
        { label: "Thu", icon: "cloud" as const, high: 21, low: 16 },
        { label: "Fri", icon: "rain" as const, high: 20, low: 15 },
      ],
    },
  }[kind]

  if (climate) {
    return {
      mode: "climate",
      summary: "Typical weather",
      detail:
        "Your trip is too far away for an accurate forecast, so we're using typical weather for this destination and time of year.",
      high: profile.high,
      low: profile.low,
      rainfall: profile.rainfall,
      conditions: profile.conditions,
    }
  }
  return {
    mode: "forecast",
    summary: profile.summary,
    detail: profile.detail,
    high: profile.high,
    low: profile.low,
    days: profile.days,
  }
}

export function generatePackingList(draft: TripDraft): PackingItem[] {
  const days = Math.max(1, durationDays(draft.startDate, draft.endDate))
  const laundry = draft.laundry === "yes"
  const activities = draft.activities
  const types = draft.types
  const note = draft.note.toLowerCase()
  const packLight = note.includes("light")
  const climate = tripClimate(draft)
  const items: PackingItem[] = []

  // Essentials
  items.push(item("Passport", "Essentials"))
  items.push(item("Wallet & cards", "Essentials"))
  items.push(
    item("Travel insurance", "Essentials", {
      note: "Keep a digital and printed copy just in case.",
    }),
  )
  items.push(item("Medication", "Essentials"))
  items.push(item("Local cash", "Essentials"))

  // Clothing — scaled by duration and laundry
  const cap = laundry ? 6 : Math.min(days, 10)
  const shirts = Math.min(days, cap)
  const underwear = laundry ? Math.min(days, 7) : days
  const socks = laundry ? Math.min(days, 7) : days
  items.push(item("T-shirts", "Clothing", { quantity: shirts }))
  items.push(item("Trousers", "Clothing", { quantity: Math.max(1, Math.ceil(days / 5)) }))
  items.push(item("Underwear", "Clothing", { quantity: underwear }))
  items.push(item("Socks", "Clothing", { quantity: socks }))
  if (climate === "cold") {
    items.push(item("Insulated winter jacket", "Clothing", { note: "Sub-zero days ahead — you'll want a warm, waterproof shell." }))
    items.push(item("Thermal tops", "Clothing", { quantity: 2 }))
    items.push(item("Fleece / mid-layer", "Clothing"))
    items.push(item("Warm hat", "Clothing"))
    items.push(item("Wool socks", "Clothing", { quantity: Math.min(days, 5) }))
  } else if (climate === "hot") {
    items.push(item("Shorts", "Clothing", { quantity: Math.max(2, Math.ceil(days / 3)) }))
    items.push(item("Light dress / linen shirt", "Clothing"))
  } else {
    items.push(item("Lightweight jacket", "Clothing"))
  }
  items.push(item("Sleepwear", "Clothing"))
  if (has(activities, "formal", "dinner", "business", "nightlife") || note.includes("dinner")) {
    items.push(
      item("Smart outfit", "Clothing", {
        note: "For a nicer evening out — some venues have a dress code.",
      }),
    )
  }

  // Shoes
  items.push(item("Walking shoes", "Shoes", { note: "Comfort matters for long days on foot." }))
  if (has(activities, "running", "marathon", "gym", "race")) items.push(item("Running shoes", "Shoes"))
  if (has(activities, "formal", "dinner", "business", "nightlife")) items.push(item("Smart shoes", "Shoes"))

  // Toiletries
  items.push(item("Toothbrush & paste", "Toiletries"))
  items.push(item("Deodorant", "Toiletries"))
  items.push(item("Sunscreen", "Toiletries"))
  items.push(
    item("Shampoo & body wash", "Toiletries", {
      note: "Most hotels provide these, so pack travel sizes only.",
    }),
  )

  // Electronics
  items.push(item("Phone charger", "Electronics"))
  items.push(item("Power bank", "Electronics"))
  items.push(item("Travel adapter", "Electronics", { needToBuy: true }))
  items.push(item("Headphones", "Electronics"))

  // Activities
  if (has(activities, "marathon", "race", "running")) {
    items.push(item("Running shorts", "Activities", { quantity: 2 }))
    items.push(item("Running top", "Activities", { quantity: 2 }))
    items.push(item("Race shoes", "Activities", { note: "Added because you're running a race." }))
    items.push(item("Running watch", "Activities"))
    items.push(item("Energy gels", "Activities", { quantity: 4, needToBuy: true }))
    items.push(item("Race confirmation", "Activities", { note: "Bring your bib pickup confirmation and ID." }))
  }
  if (has(activities, "swim", "beach") || types.includes("beach")) {
    items.push(item("Swimwear", "Activities", { quantity: 2 }))
    items.push(item("Beach towel", "Activities"))
  }
  if (has(activities, "hik", "outdoor") || types.includes("outdoor")) {
    items.push(item("Daypack", "Activities"))
    items.push(item("Water bottle", "Activities"))
  }
  if (types.includes("camping")) {
    items.push(item("Tent", "Activities", { note: "Check it's packed with poles and pegs." }))
    items.push(item("Sleeping bag", "Activities"))
    items.push(item("Headlamp", "Activities", { needToBuy: true }))
  }
  if (has(activities, "ski") || types.includes("ski")) {
    items.push(item("Ski jacket & pants", "Activities", { note: "Rent on-site if you'd rather travel light." }))
    items.push(item("Ski gloves", "Activities"))
    items.push(item("Goggles", "Activities", { needToBuy: true }))
    items.push(item("Neck gaiter / balaclava", "Activities"))
    items.push(item("Hand & toe warmers", "Activities", { quantity: 4, needToBuy: true }))
  }

  // Weather
  if (climate === "cold") {
    items.push(item("Lip balm & moisturizer", "Weather", { note: "Cold, dry air is rough on skin." }))
    items.push(item("Snow boots", "Weather"))
    items.push(item("Ski / snow sunglasses", "Weather", { note: "Glare off snow is intense even when overcast." }))
  } else if (climate === "hot") {
    items.push(item("Sun hat", "Weather"))
    items.push(item("Sunglasses", "Weather"))
    items.push(item("Reusable water bottle", "Weather", { note: "Stay hydrated in the heat." }))
  } else {
    items.push(item("Compact umbrella", "Weather", { needToBuy: true, note: "Rain is likely during your trip." }))
    items.push(item("Light rain jacket", "Weather"))
    items.push(item("Sunglasses", "Weather"))
  }

  // Per-traveler items: age-tailored items for kids.
  for (const t of draft.travelers) {
    if (t.role !== "Child") continue
    const age = resolveTravelerAge(t) ?? 6
    const forName = { assignedTo: t.id }
    if (age <= 3) {
      // baby / toddler
      items.push(item("Diapers", "Essentials", { ...forName, quantity: Math.max(6, days * 5), needToBuy: true, note: `Sized for ${t.name}.` }))
      items.push(item("Baby wipes", "Essentials", { ...forName, needToBuy: true }))
      items.push(item("Pacifier", "Essentials", { ...forName, quantity: 2 }))
      items.push(item("Formula / baby food & snacks", "Essentials", forName))
      items.push(item("Changing mat", "Essentials", forName))
      items.push(item("Stroller / baby carrier", "Essentials", forName))
      items.push(item("Comfort toy", "Activities", { ...forName, note: `Helps ${t.name} settle in a new place.` }))
      items.push(item(`${t.name}'s outfits`, "Clothing", { ...forName, quantity: Math.min(days + 2, 10), note: "Little ones go through more changes than adults." }))
    } else if (age <= 12) {
      // child
      items.push(item(`${t.name}'s outfits`, "Clothing", { ...forName, quantity: Math.min(days, 8) }))
      items.push(item("Kids' toothbrush", "Toiletries", forName))
      items.push(item("Snacks", "Essentials", forName))
      items.push(item("Travel activity / small toy", "Activities", { ...forName, note: "Keeps kids busy on long journeys." }))
    } else {
      // teenager
      items.push(item(`${t.name}'s outfits`, "Clothing", { ...forName, quantity: Math.min(days, 8) }))
      items.push(item(`${t.name}'s phone charger`, "Electronics", { ...forName, note: `${t.name} will want their own charger.` }))
      items.push(item(`${t.name}'s headphones`, "Electronics", forName))
      items.push(item(`${t.name}'s portable charger`, "Electronics", forName))
    }
  }

  return packLight ? items.filter((i) => i.name !== "Sleepwear" || days > 5).slice(0) : items
}

export function buildInsights(draft: TripDraft, weather: TripWeather): string[] {
  const insights: string[] = []
  if (draft.laundry === "yes")
    insights.push(
      "You'll have laundry available, so we've reduced the amount of clothing you need to pack.",
    )
  const climate = tripClimate(draft)
  if (climate === "cold")
    insights.push("It'll be cold and snowy, so we prioritized insulation, waterproof layers and warm accessories.")
  else if (climate === "hot")
    insights.push("Hot, sunny weather is expected, so we kept clothing light and added sun protection.")
  else if (weather.mode === "forecast")
    insights.push("Rain is expected on several days, so we've added a compact umbrella and rain jacket.")
  else
    insights.push("We used typical seasonal weather to choose your layers and rain protection.")
  if (has(draft.activities, "marathon", "race", "running"))
    insights.push("Because you're running a race, we've added race-day essentials like gels and your bib confirmation.")
  const toddler = draft.travelers.find((t) => t.role === "Child" && (resolveTravelerAge(t) ?? 6) <= 3)
  if (toddler)
    insights.push(`${toddler.name} is little, so we included diapers, wipes and a pacifier sized for them.`)
  const teen = draft.travelers.find((t) => t.role === "Child" && (resolveTravelerAge(t) ?? 6) >= 13)
  if (teen)
    insights.push(`${teen.name} is a teen, so they get their own charger and headphones.`)
  if (draft.note.toLowerCase().includes("light"))
    insights.push("You asked to pack light, so we kept clothing to versatile pieces you can mix and match.")
  if (insights.length < 3)
    insights.push("We tailored quantities to your trip length so you're covered without overpacking.")
  return insights.slice(0, 4)
}

const CLIMATE_IMAGE: Record<Climate, string> = {
  cold: "/trips/alps.png",
  hot: "/trips/mallorca.png",
  mild: "/trips/tokyo.png",
}

export function buildTripFromDraft(draft: TripDraft): Trip {
  const weather = buildWeather(draft)
  const items = generatePackingList(draft)
  return {
    id: `trip-${Date.now()}`,
    title: draft.destination || "New trip",
    destination: draft.destination || "New trip",
    country: draft.country || "",
    startDate: draft.startDate,
    endDate: draft.endDate,
    types: draft.types.length ? draft.types : ["vacation"],
    activities: draft.activities,
    accommodation: draft.accommodation ?? "hotel",
    laundry: draft.laundry ?? "unsure",
    travelers: draft.travelers,
    bags: draft.bags,
    note: draft.note,
    weather,
    items,
    insights: buildInsights(draft, weather),
    generated: true,
    status: "upcoming",
    image: CLIMATE_IMAGE[tripClimate(draft)],
  }
}
