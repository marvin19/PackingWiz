import {
  Backpack,
  BatteryCharging,
  Briefcase,
  Building2,
  Cat,
  Cloud,
  CloudRain,
  CloudSun,
  Dog,
  Dumbbell,
  Footprints,
  Headphones,
  Heart,
  Home,
  Hotel,
  type LucideIcon,
  Luggage,
  Medal,
  MoreHorizontal,
  Mountain,
  PawPrint,
  Plug,
  Shield,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  Tent,
  TreePalm,
  Umbrella,
  User,
  Users,
  Wallet,
  Watch,
} from "lucide-react"
import type {
  AccommodationId,
  BagType,
  PackingCategory,
  PetSpecies,
  TripTypeId,
} from "@/lib/types"

const TRIP_TYPE_ICONS: Record<TripTypeId, LucideIcon> = {
  vacation: TreePalm,
  business: Briefcase,
  city: Building2,
  beach: Umbrella,
  outdoor: Mountain,
  training: Dumbbell,
  race: Medal,
  ski: Snowflake,
  camping: Tent,
  family: Users,
  other: Sparkles,
}

const ACCOMMODATION_ICONS: Record<AccommodationId, LucideIcon> = {
  hotel: Hotel,
  apartment: Home,
  hostel: Building2,
  camping: Tent,
  friends: Heart,
  other: MoreHorizontal,
}

const CATEGORY_ICONS: Record<PackingCategory, LucideIcon> = {
  Essentials: Shield,
  Clothing: Shirt,
  Shoes: Footprints,
  Toiletries: Wallet,
  Electronics: Plug,
  Activities: Medal,
  Weather: Umbrella,
}

const WEATHER_ICONS = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  partly: CloudSun,
  snow: Snowflake,
} as const

const BAG_ICONS: Record<BagType, LucideIcon> = {
  checked: Luggage,
  carryon: Luggage,
  backpack: Backpack,
  duffel: Briefcase,
  personal: Briefcase,
  other: MoreHorizontal,
}

const PET_ICONS: Record<PetSpecies, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  other: PawPrint,
}

export function tripTypeIcon(id: TripTypeId): LucideIcon {
  return TRIP_TYPE_ICONS[id] ?? Sparkles
}

export function bagIcon(type: BagType): LucideIcon {
  return BAG_ICONS[type] ?? Luggage
}

export function petIcon(species?: PetSpecies): LucideIcon {
  return species ? PET_ICONS[species] ?? PawPrint : PawPrint
}

export { PawPrint, User }

export function accommodationIcon(id: AccommodationId): LucideIcon {
  return ACCOMMODATION_ICONS[id] ?? Home
}

export function categoryIcon(cat: PackingCategory): LucideIcon {
  return CATEGORY_ICONS[cat] ?? Backpack
}

export function weatherIcon(key: keyof typeof WEATHER_ICONS): LucideIcon {
  return WEATHER_ICONS[key] ?? CloudSun
}

export {
  Backpack,
  BatteryCharging,
  Headphones,
  Watch,
}
