import type { Bag } from '@/domain/bag';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import type {
  AccommodationId,
  LaundryOption,
  Trip,
  TripStatus,
  TripTypeId,
} from '@/domain/trip';
import type { TripWeather, WeatherDay } from '@/domain/weather';

/** Database row shapes — kept out of domain layer */

export interface DbTripRow {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  country: string;
  start_date: string;
  end_date: string;
  accommodation: string;
  laundry: string;
  note: string;
  types: string[] | null;
  activities: string[] | null;
  generated: boolean;
  status: string;
  image: string | null;
  trip_travelers?: DbTravelerRow[] | null;
  trip_bags?: DbBagRow[] | null;
  packing_items?: DbPackingItemRow[] | null;
  trip_weather?: DbWeatherRow | DbWeatherRow[] | null;
  trip_insights?: DbInsightRow[] | null;
}

export interface DbTravelerRow {
  id: string;
  trip_id: string;
  name: string;
  role: string;
  age: number | null;
  birth_date: string | null;
  sort_order: number;
}

export interface DbBagRow {
  id: string;
  trip_id: string;
  name: string;
  type: string;
  owner_id: string | null;
  sort_order: number;
}

export interface DbPackingItemRow {
  id: string;
  trip_id: string;
  name: string;
  quantity: number;
  category: string;
  packed: boolean;
  need_to_buy: boolean;
  assigned_to: string | null;
  note: string | null;
  sort_order: number;
}

export interface DbWeatherRow {
  trip_id: string;
  mode: string;
  summary: string;
  detail: string;
  high: number;
  low: number;
  rainfall: string | null;
  conditions: string | null;
  days: WeatherDay[] | null;
}

export interface DbInsightRow {
  id: string;
  trip_id: string;
  content: string;
  sort_order: number;
}

export interface DbPackingItemPatch {
  packed?: boolean;
  quantity?: number;
  need_to_buy?: boolean;
  assigned_to?: string | null;
  name?: string;
  category?: string;
  note?: string | null;
}

export function sortByOrder<T extends { sort_order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}

export function mapTravelerRow(row: DbTravelerRow): Traveler {
  return {
    id: row.id,
    name: row.name,
    role: row.role as Traveler['role'],
    age: row.age ?? undefined,
    birthDate: row.birth_date ?? undefined,
  };
}

export function mapBagRow(row: DbBagRow): Bag {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Bag['type'],
    ownerId: row.owner_id,
  };
}

export function mapPackingItemRow(row: DbPackingItemRow): PackingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category as PackingCategory,
    packed: row.packed,
    needToBuy: row.need_to_buy,
    assignedTo: row.assigned_to,
    note: row.note ?? undefined,
  };
}

function mapWeatherRow(row: DbWeatherRow): TripWeather {
  return {
    mode: row.mode as TripWeather['mode'],
    summary: row.summary,
    detail: row.detail,
    high: Number(row.high),
    low: Number(row.low),
    rainfall: row.rainfall ?? undefined,
    conditions: row.conditions ?? undefined,
    days: row.days ?? undefined,
  };
}

export function mapTripRow(row: DbTripRow): Trip {
  const travelers = sortByOrder(row.trip_travelers ?? []).map(mapTravelerRow);
  const bags = sortByOrder(row.trip_bags ?? []).map(mapBagRow);
  const items = sortByOrder(row.packing_items ?? []).map(mapPackingItemRow);
  const insights = sortByOrder(row.trip_insights ?? []).map((entry) => entry.content);

  const weatherSource = row.trip_weather;
  const weatherRow = Array.isArray(weatherSource) ? weatherSource[0] : weatherSource;

  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    country: row.country,
    startDate: row.start_date,
    endDate: row.end_date,
    types: (row.types ?? []) as TripTypeId[],
    activities: row.activities ?? [],
    accommodation: row.accommodation as AccommodationId,
    laundry: row.laundry as LaundryOption,
    travelers,
    bags,
    note: row.note,
    weather: weatherRow ? mapWeatherRow(weatherRow) : emptyWeather(),
    items,
    insights,
    generated: row.generated,
    status: row.status as TripStatus,
    image: row.image ?? undefined,
  };
}

function emptyWeather(): TripWeather {
  return {
    mode: 'climate',
    summary: '',
    detail: '',
    high: 0,
    low: 0,
  };
}

/** Payload for create_trip_with_details RPC — camelCase keys match function expectations */
export function tripToCreatePayload(trip: Trip): Record<string, unknown> {
  return {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    country: trip.country,
    startDate: trip.startDate,
    endDate: trip.endDate,
    types: trip.types,
    activities: trip.activities,
    accommodation: trip.accommodation,
    laundry: trip.laundry,
    note: trip.note,
    generated: trip.generated,
    status: trip.status,
    image: trip.image ?? null,
    travelers: trip.travelers.map((traveler) => ({
      id: traveler.id,
      name: traveler.name,
      role: traveler.role,
      age: traveler.age ?? null,
      birthDate: traveler.birthDate ?? null,
    })),
    bags: trip.bags.map((bag) => ({
      id: bag.id,
      name: bag.name,
      type: bag.type,
      ownerId: bag.ownerId,
    })),
    items: trip.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      packed: item.packed,
      needToBuy: item.needToBuy,
      assignedTo: item.assignedTo,
      note: item.note ?? null,
    })),
    weather: trip.weather,
    insights: trip.insights,
  };
}

export function packingItemPatchToDb(
  patch: Partial<
    Pick<PackingItem, 'packed' | 'quantity' | 'needToBuy' | 'assignedTo' | 'name' | 'category' | 'note'>
  >,
): DbPackingItemPatch {
  const dbPatch: DbPackingItemPatch = {};

  if (patch.packed !== undefined) {
    dbPatch.packed = patch.packed;
  }
  if (patch.quantity !== undefined) {
    dbPatch.quantity = patch.quantity;
  }
  if (patch.needToBuy !== undefined) {
    dbPatch.need_to_buy = patch.needToBuy;
  }
  if (patch.assignedTo !== undefined) {
    dbPatch.assigned_to = patch.assignedTo;
  }
  if (patch.name !== undefined) {
    dbPatch.name = patch.name;
  }
  if (patch.category !== undefined) {
    dbPatch.category = patch.category;
  }
  if (patch.note !== undefined) {
    dbPatch.note = patch.note;
  }

  return dbPatch;
}

export function newPackingItemToDbInsert(
  tripId: string,
  input: {
    id: string;
    name: string;
    category: PackingCategory;
    quantity: number;
    packed: boolean;
    needToBuy: boolean;
    assignedTo: string | null;
    note?: string;
    sortOrder: number;
  },
): Record<string, unknown> {
  return {
    id: input.id,
    trip_id: tripId,
    name: input.name,
    quantity: input.quantity,
    category: input.category,
    packed: input.packed,
    need_to_buy: input.needToBuy,
    assigned_to: input.assignedTo,
    note: input.note ?? null,
    sort_order: input.sortOrder,
  };
}
