import type { InsightLike } from '@/domain/insight';
import { normalizeInsights } from '@/domain/insight';
import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfileSnapshot } from '@/domain/packing-profile';
import type { Traveler } from '@/domain/traveler';
import type { Trip, PackingMode, TripStatus } from '@/domain/trip';
import { deriveTripDateBucket } from '@/domain/trip-lifecycle';
import { isLegacyTripIngress } from '@/domain/trip-canonical';
import { suggestDefaultTripNameFromDestination } from '@/domain/trip-name';

function cloneItem(item: PackingItem): PackingItem {
  return { ...item };
}

/**
 * Trip input before normalization — legacy reads may omit nested packingLists/name.
 * Repository and assembly paths should pass through normalizeTrip before use.
 */
export type TripLike = Omit<Trip, 'name' | 'packingLists' | 'insights'> & {
  name?: string;
  packingLists?: PackingList[];
  insights?: readonly InsightLike[];
};

/** Deterministic primary list id for the single-list compatibility migration. */
export function primaryPackingListId(tripId: string): string {
  return `${tripId}-list-primary`;
}

/** Deterministic synthetic self profile id for the single-list compatibility migration. */
export function primaryPackingProfileId(tripId: string): string {
  return `${tripId}-profile-self`;
}

/** True when a list is the temporary MP1 deterministic compatibility primary list. */
export function isCompatibilityPrimaryList(tripId: string, list: Pick<PackingList, 'id'>): boolean {
  return list.id === primaryPackingListId(tripId);
}

function findExplicitSelfTraveler(travelers: Traveler[]): Traveler | undefined {
  return travelers.find((traveler) => traveler.id === 't-you' || traveler.name === 'You');
}

/**
 * Temporary MP1B rule: one primary list represents today's flat Trip.items.
 *
 * Self profile:
 * - explicit legacy self traveler (`t-you` / "You") → copy name/age/birthDate
 * - otherwise → synthetic "Me" with no guessed age/birthDate
 *
 * Never infer self from the first traveler. Additional travelers stay unmigrated until MP2+.
 */
export function buildPrimaryProfileSnapshot(
  tripId: string,
  travelers: Traveler[],
): PackingProfileSnapshot {
  const selfTraveler = findExplicitSelfTraveler(travelers);

  if (selfTraveler) {
    return {
      id: primaryPackingProfileId(tripId),
      name: selfTraveler.name,
      age: selfTraveler.age,
      birthDate: selfTraveler.birthDate,
      isSelf: true,
    };
  }

  return {
    id: primaryPackingProfileId(tripId),
    name: 'Me',
    isSelf: true,
  };
}

export function buildPrimaryPackingList(
  tripId: string,
  travelers: Traveler[],
  packingMode: PackingMode,
  items: PackingItem[],
): PackingList {
  const profileSnapshot = buildPrimaryProfileSnapshot(tripId, travelers);

  return {
    id: primaryPackingListId(tripId),
    packingProfileId: profileSnapshot.id,
    profileSnapshot,
    packingMode,
    items: items.map(cloneItem),
  };
}

function clonePackingList(list: PackingList): PackingList {
  return {
    ...list,
    profileSnapshot: { ...list.profileSnapshot },
    items: list.items.map(cloneItem),
  };
}

function resolveTripName(trip: TripLike): string {
  const explicitName = trip.name?.trim() || trip.title?.trim();
  if (explicitName) {
    return explicitName;
  }

  return suggestDefaultTripNameFromDestination(trip.destination);
}

/**
 * Resolve the PackingList that supplies deprecated Trip-level mirrors.
 *
 * Rules (MP6-A):
 * - 0 lists → undefined
 * - 1 list → that list (safe auto-resolution)
 * - 2+ lists → list whose id matches `primaryPackingListId(trip.id)` when present
 * - 2+ lists with no compatibility-primary → undefined (never fall back to array index 0)
 */
export function resolveCompatibilityPrimaryPackingList(trip: Trip): PackingList | undefined {
  if (trip.packingLists.length === 0) {
    return undefined;
  }

  if (trip.packingLists.length === 1) {
    return trip.packingLists[0];
  }

  return trip.packingLists.find((list) => isCompatibilityPrimaryList(trip.id, list));
}

/**
 * Sync deprecated Trip-level mirrors from the compatibility-primary list when resolved.
 * Does not migrate legacy ingress or rewrite list ids.
 *
 * When multiple lists exist and no compatibility-primary list is found, flat mirrors are
 * left unchanged — canonical multi-list runtime must not assume packingLists[0] is primary.
 */
export function syncLegacyTripMirrors(trip: Trip): Trip {
  const name = resolveTripName(trip);
  const mirrorList = resolveCompatibilityPrimaryPackingList(trip);

  if (!mirrorList) {
    return {
      ...trip,
      name,
      title: name,
      insights: normalizeInsights(trip.insights),
      status: normalizeTripStatus(trip),
    };
  }

  return {
    ...trip,
    name,
    title: name,
    items: mirrorList.items.map(cloneItem),
    packingMode: mirrorList.packingMode,
    generated: mirrorList.packingMode === 'generated',
    insights: normalizeInsights(trip.insights),
    status: normalizeTripStatus(trip),
  };
}

/**
 * Normalize an already-nested trip without legacy ingress migration.
 * Idempotent for canonical multi-list trips (preserves list ids, order, snapshots, modes).
 */
export function normalizeCanonicalTrip(trip: Trip): Trip {
  const packingLists = trip.packingLists.map(clonePackingList);

  return syncLegacyTripMirrors({
    ...trip,
    packingLists,
  });
}

/**
 * Migrate flat/single-list compatibility ingress into nested packingLists.
 */
function migrateLegacyTripIngress(trip: TripLike): Trip {
  const legacyItems = trip.items.map(cloneItem);
  const legacyPackingMode = trip.packingMode;

  let packingLists: PackingList[];

  if (!trip.packingLists || trip.packingLists.length === 0) {
    packingLists = [
      buildPrimaryPackingList(trip.id, trip.travelers, legacyPackingMode, legacyItems),
    ];
  } else {
    const profileSnapshot = buildPrimaryProfileSnapshot(trip.id, trip.travelers);
    const existing = clonePackingList(trip.packingLists[0]);

    packingLists = [
      {
        ...existing,
        id: primaryPackingListId(trip.id),
        packingProfileId: existing.packingProfileId || profileSnapshot.id,
        profileSnapshot: existing.profileSnapshot ?? profileSnapshot,
      },
    ];
  }

  const name = resolveTripName(trip);

  return {
    ...(trip as Trip),
    name,
    title: name,
    packingLists,
    travelers: trip.travelers.map((traveler) => ({ ...traveler })),
  };
}

/**
 * Normalize a trip to the target nested shape while keeping legacy mirrors in sync.
 *
 * Precedence:
 * - legacy ingress (no lists / compatibility primary list) → migrateLegacyTripIngress
 * - canonical nested lists → normalizeCanonicalTrip (idempotent)
 * - deprecated Trip.items / Trip.packingMode mirror the compatibility-primary list when resolved
 */
export function normalizeTrip(trip: TripLike): Trip {
  if (isLegacyTripIngress(trip)) {
    return syncLegacyTripMirrors(migrateLegacyTripIngress(trip));
  }

  const name = resolveTripName(trip);

  return normalizeCanonicalTrip({
    ...(trip as Trip),
    name,
    title: name,
    packingLists: (trip.packingLists ?? []).map(clonePackingList),
    travelers: trip.travelers.map((traveler) => ({ ...traveler })),
  });
}

/** Maps legacy archived/missing status to date-derived buckets; preserves stored upcoming/past. */
function normalizeTripStatus(trip: TripLike, referenceDate: Date = new Date()): TripStatus {
  if (trip.status === 'past' || trip.status === 'upcoming') {
    return trip.status;
  }

  const withDates = {
    ...trip,
    name: resolveTripName(trip),
    title: resolveTripName(trip),
    packingLists: trip.packingLists ?? [],
    items: trip.items ?? [],
    insights: normalizeInsights(trip.insights),
    status: 'upcoming',
  } as Trip;

  return deriveTripDateBucket(withDates, referenceDate);
}

/** Legacy mirror source list — compatibility-primary id lookup, not packingLists[0]. */
export function getPrimaryPackingList(trip: Trip): PackingList {
  const list = resolveCompatibilityPrimaryPackingList(trip);
  if (!list) {
    throw new Error('Trip has no legacy mirror packing list');
  }

  return list;
}

/** @deprecated Read list items via packingLists or allTripPackingItems — mirrors compatibility-primary list only. */
export function getTripPackingItems(trip: Trip): PackingItem[] {
  return getPrimaryPackingList(trip).items;
}

/** @deprecated Read list packingMode on the target PackingList — mirrors compatibility-primary list only. */
export function getTripPackingMode(trip: Trip): PackingMode {
  return getPrimaryPackingList(trip).packingMode;
}

export function findTripPackingItem(trip: Trip, itemId: string): PackingItem | undefined {
  return getTripPackingItems(trip).find((item) => item.id === itemId);
}

/** Update the primary packing list immutably; re-normalizes legacy compatibility mirrors. */
export function updatePrimaryPackingList(
  trip: Trip,
  updater: (list: PackingList) => PackingList,
): Trip {
  const updatedPrimary = updater(clonePackingList(getPrimaryPackingList(trip)));
  const primaryId = getPrimaryPackingList(trip).id;

  return syncLegacyTripMirrors({
    ...trip,
    packingLists: trip.packingLists.map((list) =>
      list.id === primaryId ? updatedPrimary : clonePackingList(list),
    ),
  });
}

/** Replace all items on the primary packing list. */
export function replacePrimaryPackingItems(trip: Trip, items: PackingItem[]): Trip {
  return updatePrimaryPackingList(trip, (list) => ({
    ...list,
    items: items.map(cloneItem),
  }));
}

/** Patch one item on the primary packing list by id. */
export function patchPrimaryPackingItem(
  trip: Trip,
  itemId: string,
  patch: Partial<PackingItem>,
): Trip {
  return updatePrimaryPackingList(trip, (list) => ({
    ...list,
    items: list.items.map((item) => (item.id === itemId ? { ...item, ...patch } : cloneItem(item))),
  }));
}

/** Append one item to the primary packing list. */
export function appendPrimaryPackingItem(trip: Trip, item: PackingItem): Trip {
  return updatePrimaryPackingList(trip, (list) => ({
    ...list,
    items: [...list.items.map(cloneItem), cloneItem(item)],
  }));
}

/** Remove one item from the primary packing list by id. */
export function removePrimaryPackingItem(trip: Trip, itemId: string): Trip {
  return updatePrimaryPackingList(trip, (list) => ({
    ...list,
    items: list.items.filter((item) => item.id !== itemId),
  }));
}

/** Lookup a nested PackingList by id on a normalized trip. */
export function findPackingListById(trip: Trip, listId: string): PackingList | undefined {
  return trip.packingLists.find((list) => list.id === listId);
}

/** Strict lookup for mutation paths — throws when the list id is missing. */
export function requirePackingList(trip: Trip, listId: string): PackingList {
  const list = findPackingListById(trip, listId);
  if (!list) {
    throw new Error(`Packing list not found: ${listId}`);
  }

  return list;
}

/** Items for a specific packing list; returns [] when the list id is missing. */
export function getPackingListItems(trip: Trip, listId: string): PackingItem[] {
  return findPackingListById(trip, listId)?.items ?? [];
}

/** Strict items lookup for mutation paths — throws when the list id is missing. */
export function getPackingListItemsOrThrow(trip: Trip, listId: string): PackingItem[] {
  return requirePackingList(trip, listId).items;
}

export function findPackingItemInList(
  trip: Trip,
  listId: string,
  itemId: string,
): PackingItem | undefined {
  const list = findPackingListById(trip, listId);
  if (!list) {
    return undefined;
  }

  return list.items.find((item) => item.id === itemId);
}

/**
 * Update one packing list immutably. Re-normalizes legacy mirrors when the primary list changes.
 */
export function updatePackingListById(
  trip: Trip,
  listId: string,
  updater: (list: PackingList) => PackingList,
): Trip {
  const index = trip.packingLists.findIndex((list) => list.id === listId);
  if (index < 0) {
    throw new Error(`Packing list not found: ${listId}`);
  }

  const updatedList = updater(clonePackingList(trip.packingLists[index]));
  const nextLists = trip.packingLists.map((list, listIndex) =>
    listIndex === index ? updatedList : clonePackingList(list),
  );

  const mirrorList = resolveCompatibilityPrimaryPackingList(trip);

  if (mirrorList && listId === mirrorList.id) {
    return syncLegacyTripMirrors({ ...trip, packingLists: nextLists });
  }

  return { ...trip, packingLists: nextLists };
}

export function replacePackingListItems(trip: Trip, listId: string, items: PackingItem[]): Trip {
  return updatePackingListById(trip, listId, (list) => ({
    ...list,
    items: items.map(cloneItem),
  }));
}

export function patchPackingListItem(
  trip: Trip,
  listId: string,
  itemId: string,
  patch: Partial<PackingItem>,
): Trip {
  return updatePackingListById(trip, listId, (list) => ({
    ...list,
    items: list.items.map((item) => (item.id === itemId ? { ...item, ...patch } : cloneItem(item))),
  }));
}

export function appendPackingListItem(trip: Trip, listId: string, item: PackingItem): Trip {
  return updatePackingListById(trip, listId, (list) => ({
    ...list,
    items: [...list.items.map(cloneItem), cloneItem(item)],
  }));
}

export function removePackingListItem(trip: Trip, listId: string, itemId: string): Trip {
  return updatePackingListById(trip, listId, (list) => ({
    ...list,
    items: list.items.filter((item) => item.id !== itemId),
  }));
}
