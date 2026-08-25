import type { Bag } from '@/domain/bag';
import type { Destination } from '@/domain/destination';
import { createDestinationFromText, getDestinationCountryLabel, getDestinationLabel } from '@/domain/destination';
import type { PackingCategory, PackingItem } from '@/domain/packing-item';
import type { Traveler } from '@/domain/traveler';
import { getTripPackingItems, getTripPackingMode, normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { getTripName } from '@/domain/trip-name';
import type {
  AccommodationId,
  LaundryOption,
  Trip,
  TripStatus,
} from '@/domain/trip';
import type { TripWeather, WeatherDay } from '@/domain/weather';

/** Database row shapes — kept out of domain layer */

/** Travelers, bags, and packing items use composite PK (trip_id, id) in Postgres. */
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
    source: 'generated',
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

function mapDestinationFromRow(row: DbTripRow): Destination {
  return createDestinationFromText(row.destination, row.country || undefined);
}

function mapTripContextFromRow(row: DbTripRow): string[] {
  if (row.activities && row.activities.length > 0) {
    return row.activities;
  }

  return (row.types ?? []).map((type) => type.replace(/_/g, ' '));
}

export function mapTripRow(row: DbTripRow): Trip {
  const travelers = sortByOrder(row.trip_travelers ?? []).map(mapTravelerRow);
  const bags = sortByOrder(row.trip_bags ?? []).map(mapBagRow);
  const items = sortByOrder(row.packing_items ?? []).map(mapPackingItemRow);
  const insights = sortByOrder(row.trip_insights ?? []).map((entry) => entry.content);

  const weatherSource = row.trip_weather;
  const weatherRow = Array.isArray(weatherSource) ? weatherSource[0] : weatherSource;

  const legacyTrip: TripLike = {
    id: row.id,
    title: row.title,
    destination: mapDestinationFromRow(row),
    startDate: row.start_date,
    endDate: row.end_date,
    tripContext: mapTripContextFromRow(row),
    accommodation: row.accommodation as AccommodationId,
    laundry: row.laundry as LaundryOption,
    travelers,
    bags,
    note: row.note,
    weather: weatherRow ? mapWeatherRow(weatherRow) : emptyWeather(),
    items,
    insights,
    packingMode: row.generated ? 'generated' : 'manual',
    generated: row.generated,
    status: row.status as TripStatus,
    image: row.image ?? undefined,
  };

  return normalizeTrip(legacyTrip);
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
  const normalized = normalizeTrip(trip);

  return {
    id: normalized.id,
    title: getTripName(normalized),
    destination: getDestinationLabel(normalized.destination),
    country: getDestinationCountryLabel(normalized.destination),
    startDate: normalized.startDate,
    endDate: normalized.endDate,
    types: [],
    activities: normalized.tripContext,
    accommodation: normalized.accommodation,
    laundry: normalized.laundry,
    note: normalized.note,
    generated: getTripPackingMode(normalized) === 'generated',
    status: normalized.status,
    image: normalized.image ?? null,
    travelers: normalized.travelers.map((traveler) => ({
      id: traveler.id,
      name: traveler.name,
      role: traveler.role,
      age: traveler.age ?? null,
      birthDate: traveler.birthDate ?? null,
    })),
    bags: normalized.bags.map((bag) => ({
      id: bag.id,
      name: bag.name,
      type: bag.type,
      ownerId: bag.ownerId,
    })),
    items: getTripPackingItems(normalized).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      packed: item.packed,
      needToBuy: item.needToBuy,
      assignedTo: item.assignedTo,
      note: item.note ?? null,
    })),
    weather: normalized.weather,
    insights: normalized.insights,
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

/** Full flat packing_items row for primary-list snapshot sync. */
export function packingItemToDbRow(
  tripId: string,
  item: PackingItem,
  sortOrder: number,
): Record<string, unknown> {
  return newPackingItemToDbInsert(tripId, {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    packed: item.packed,
    needToBuy: item.needToBuy,
    assignedTo: item.assignedTo,
    note: item.note,
    sortOrder,
  });
}
