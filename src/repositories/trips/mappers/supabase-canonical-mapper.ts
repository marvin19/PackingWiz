import type { ImportantItem } from '@/domain/important-item';
import type { ImportantItemsConfig } from '@/domain/important-items-config';
import type { PackingCategory, PackingItem, PackingItemSource } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfile, PackingProfileSnapshot } from '@/domain/packing-profile';
import type { Traveler } from '@/domain/traveler';
import type { Trip, PackingMode } from '@/domain/trip';
import { insightFromPersistedContent } from '@/domain/insight';
import {
  buildPrimaryPackingList,
  normalizeCanonicalTrip,
  primaryPackingListId,
} from '@/domain/trip-compatibility';

import type { Bag } from '@/domain/bag';
import { createDestinationFromText } from '@/domain/destination';

import type {
  DbCanonicalPackingItemRow,
  DbCanonicalTripAggregate,
  DbImportantProfileConfigRow,
  DbImportantProfileItemRow,
  DbPackingListRow,
  DbPackingProfileRow,
  DbProfileSnapshotJson,
} from '@/repositories/trips/mappers/supabase-canonical-types';
import { mapTripRow, type DbTripRow } from '@/repositories/trips/mappers/trip-mapper';

const DRAFT_PROFILE_PREFIX = 'draft-profile-';

/** Draft-only profile ids must not be written to packing_profiles (MP6-B1 boundary). */
export function isPersistablePackingProfileId(profileId: string): boolean {
  return profileId.trim().length > 0 && !profileId.startsWith(DRAFT_PROFILE_PREFIX);
}

export function profileSnapshotToJson(snapshot: PackingProfileSnapshot): DbProfileSnapshotJson {
  const json: DbProfileSnapshotJson = {
    id: snapshot.id,
    name: snapshot.name,
    isSelf: snapshot.isSelf,
  };

  if (snapshot.age !== undefined) {
    json.age = snapshot.age;
  }
  if (snapshot.birthDate !== undefined) {
    json.birthDate = snapshot.birthDate;
  }

  return json;
}

export function mapJsonToProfileSnapshot(json: DbProfileSnapshotJson): PackingProfileSnapshot {
  return {
    id: json.id,
    name: json.name,
    age: json.age,
    birthDate: json.birthDate,
    isSelf: json.isSelf,
  };
}

export function mapDbPackingListRow(row: DbPackingListRow, items: PackingItem[]): PackingList {
  return {
    id: row.id,
    packingProfileId: row.packing_profile_id,
    profileSnapshot: mapJsonToProfileSnapshot(row.profile_snapshot),
    packingMode: row.packing_mode,
    items,
  };
}

export function mapPackingListToDbInsert(
  tripId: string,
  list: PackingList,
  sortOrder: number,
): Omit<DbPackingListRow, 'created_at' | 'updated_at'> {
  return {
    trip_id: tripId,
    id: list.id,
    packing_profile_id: list.packingProfileId,
    profile_snapshot: profileSnapshotToJson(list.profileSnapshot),
    packing_mode: list.packingMode,
    sort_order: sortOrder,
  };
}

export function mapDbCanonicalPackingItemRow(row: DbCanonicalPackingItemRow): PackingItem {
  const item: PackingItem = {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category as PackingCategory,
    packed: row.packed,
    needToBuy: row.need_to_buy,
    assignedTo: row.assigned_to,
    note: row.note ?? undefined,
  };

  if (row.source) {
    item.source = row.source as PackingItemSource;
  }
  if (row.important_item_id) {
    item.importantItemId = row.important_item_id;
  }

  return item;
}

export function mapPackingItemToDbRow(
  tripId: string,
  packingListId: string,
  item: PackingItem,
  sortOrder: number,
): DbCanonicalPackingItemRow {
  return {
    trip_id: tripId,
    packing_list_id: packingListId,
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    category: item.category,
    packed: item.packed,
    need_to_buy: item.needToBuy,
    assigned_to: item.assignedTo,
    note: item.note ?? null,
    source: item.source ?? null,
    important_item_id: item.importantItemId ?? null,
    sort_order: sortOrder,
  };
}

export function groupPackingItemsByListId(
  rows: DbCanonicalPackingItemRow[],
): Map<string, PackingItem[]> {
  const grouped = new Map<string, PackingItem[]>();

  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  for (const row of sorted) {
    const listItems = grouped.get(row.packing_list_id) ?? [];
    listItems.push(mapDbCanonicalPackingItemRow(row));
    grouped.set(row.packing_list_id, listItems);
  }

  return grouped;
}

/**
 * Application-side mirror of the SQL flat-trip forward migration.
 * Produces exactly one compatibility PackingList — never multiple people from legacy metadata.
 */
export function buildLegacyFlatTripCompatibilityList(input: {
  tripId: string;
  travelers: Traveler[];
  packingMode: PackingMode;
  items: PackingItem[];
}): PackingList {
  return buildPrimaryPackingList(
    input.tripId,
    input.travelers,
    input.packingMode,
    input.items,
  );
}

/** Map a canonical Trip aggregate to nested DB write rows (MP6-B2 save path). */
export function mapCanonicalTripToDbWrites(trip: Trip): {
  packingLists: ReturnType<typeof mapPackingListToDbInsert>[];
  packingItems: DbCanonicalPackingItemRow[];
} {
  const normalized = normalizeCanonicalTrip(trip);
  const packingLists = normalized.packingLists.map((list, index) =>
    mapPackingListToDbInsert(normalized.id, list, index),
  );

  const packingItems: DbCanonicalPackingItemRow[] = [];
  for (const list of normalized.packingLists) {
    list.items.forEach((item, index) => {
      packingItems.push(mapPackingItemToDbRow(normalized.id, list.id, item, index));
    });
  }

  return { packingLists, packingItems };
}

function mapDbBagRow(row: DbCanonicalTripAggregate['trip_bags'][number]): Bag {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Bag['type'],
    ownerId: row.owner_id,
  };
}

function sortByOrder<T extends { sort_order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}

/** Map loaded DB aggregate to canonical Trip (MP6-B2 load path). */
export function mapDbAggregateToCanonicalTrip(aggregate: DbCanonicalTripAggregate): Trip {
  const itemsByList = groupPackingItemsByListId(aggregate.packing_items);
  const packingLists = sortByOrder(aggregate.packing_lists).map((row) =>
    mapDbPackingListRow(row, itemsByList.get(row.id) ?? []),
  );

  const canonicalTrip: Trip = {
    id: aggregate.trip.id,
    name: aggregate.trip.title,
    title: aggregate.trip.title,
    destination: createDestinationFromText(
      aggregate.trip.destination,
      aggregate.trip.country || undefined,
    ),
    startDate: aggregate.trip.start_date,
    endDate: aggregate.trip.end_date,
    tripContext: aggregate.trip.activities?.length
      ? aggregate.trip.activities
      : (aggregate.trip.types ?? []).map((type) => type.replace(/_/g, ' ')),
    accommodation: aggregate.trip.accommodation as Trip['accommodation'],
    laundry: aggregate.trip.laundry as Trip['laundry'],
    note: aggregate.trip.note,
    bags: sortByOrder(aggregate.trip_bags).map(mapDbBagRow),
    travelers: [],
    weather: aggregate.trip_weather
      ? {
          mode: aggregate.trip_weather.mode as Trip['weather']['mode'],
          summary: aggregate.trip_weather.summary,
          detail: aggregate.trip_weather.detail,
          high: Number(aggregate.trip_weather.high),
          low: Number(aggregate.trip_weather.low),
          rainfall: aggregate.trip_weather.rainfall ?? undefined,
          conditions: aggregate.trip_weather.conditions ?? undefined,
          days: aggregate.trip_weather.days ?? undefined,
        }
      : {
          mode: 'climate',
          summary: '',
          detail: '',
          high: 0,
          low: 0,
        },
    insights: sortByOrder(aggregate.trip_insights).map((row) =>
      insightFromPersistedContent(row.id, row.content),
    ),
    packingLists,
    items: [],
    packingMode: 'manual',
    generated: false,
    status: aggregate.trip.status as Trip['status'],
    image: aggregate.trip.image ?? undefined,
  };

  return normalizeCanonicalTrip(canonicalTrip);
}

/** Supabase nested select row — canonical lists when present; legacy flat ingress otherwise. */
export function mapSupabaseSelectRowToTrip(row: Record<string, unknown>): Trip {
  const packingLists = (row.packing_lists as DbPackingListRow[] | null) ?? [];

  if (packingLists.length === 0) {
    return mapTripRow(row as unknown as DbTripRow);
  }

  const aggregate: DbCanonicalTripAggregate = {
    trip: {
      id: row.id as string,
      user_id: row.user_id as string,
      title: row.title as string,
      destination: row.destination as string,
      country: row.country as string,
      start_date: row.start_date as string,
      end_date: row.end_date as string,
      accommodation: row.accommodation as string,
      laundry: row.laundry as string,
      note: row.note as string,
      types: (row.types as string[] | null) ?? null,
      activities: (row.activities as string[] | null) ?? null,
      generated: row.generated as boolean,
      status: row.status as string,
      image: (row.image as string | null) ?? null,
    },
    packing_lists: packingLists,
    packing_items: ((row.packing_items as DbCanonicalPackingItemRow[] | null) ?? []).map(
      (item) => ({
        ...item,
        packing_list_id: item.packing_list_id,
      }),
    ),
    trip_bags: (row.trip_bags as DbCanonicalTripAggregate['trip_bags']) ?? [],
    trip_weather: Array.isArray(row.trip_weather)
      ? ((row.trip_weather[0] as DbCanonicalTripAggregate['trip_weather']) ?? null)
      : ((row.trip_weather as DbCanonicalTripAggregate['trip_weather']) ?? null),
    trip_insights: (row.trip_insights as DbCanonicalTripAggregate['trip_insights']) ?? [],
  };

  return mapDbAggregateToCanonicalTrip(aggregate);
}

export function mapDbPackingProfileRow(row: DbPackingProfileRow): PackingProfile {
  return {
    id: row.id,
    name: row.name,
    age: row.age ?? undefined,
    birthDate: row.birth_date ?? undefined,
    isSelf: row.is_self,
  };
}

export function mapPackingProfileToDbRow(
  userId: string,
  profile: PackingProfile,
): DbPackingProfileRow {
  return {
    user_id: userId,
    id: profile.id,
    name: profile.name,
    age: profile.age ?? null,
    birth_date: profile.birthDate ?? null,
    is_self: profile.isSelf,
  };
}

export function mapDbImportantMasterToConfig(
  configRow: DbImportantProfileConfigRow | null,
  itemRows: DbImportantProfileItemRow[],
): ImportantItemsConfig {
  if (!configRow) {
    return {
      items: [],
      isConfigured: false,
      isEnabled: false,
      promptDismissed: false,
    };
  }

  const items: ImportantItem[] = [...itemRows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      enabled: row.enabled,
    }));

  return {
    items,
    isConfigured: configRow.is_configured,
    isEnabled: configRow.is_enabled,
    promptDismissed: configRow.prompt_dismissed,
    updatedAt: configRow.updated_at ?? undefined,
  };
}

export function mapImportantConfigToDbRows(
  userId: string,
  profileId: string,
  config: ImportantItemsConfig,
): {
  configRow: DbImportantProfileConfigRow;
  itemRows: DbImportantProfileItemRow[];
} {
  const configRow: DbImportantProfileConfigRow = {
    user_id: userId,
    packing_profile_id: profileId,
    is_configured: config.isConfigured,
    is_enabled: config.isEnabled,
    prompt_dismissed: config.promptDismissed,
    updated_at: config.updatedAt ?? null,
  };

  const itemRows = config.items.map((item, index) => ({
    user_id: userId,
    packing_profile_id: profileId,
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    enabled: item.enabled,
    sort_order: index,
  }));

  return { configRow, itemRows };
}

/**
 * Returns packing list ids referenced by a trip delete — profiles are NOT included.
 * Trip delete cascades lists and list-scoped items only.
 */
export function packingListIdsForTripDelete(trip: Trip): string[] {
  return trip.packingLists.map((list) => list.id);
}

/** Compatibility primary list id used by legacy flat ingress — not authoritative for multi-list. */
export function compatibilityPrimaryListIdForTrip(tripId: string): string {
  return primaryPackingListId(tripId);
}
