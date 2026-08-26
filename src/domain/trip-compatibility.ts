import type { PackingItem } from '@/domain/packing-item';
import type { PackingList } from '@/domain/packing-list';
import type { PackingProfileSnapshot } from '@/domain/packing-profile';
import type { Traveler } from '@/domain/traveler';
import type { Trip, PackingMode } from '@/domain/trip';
import { suggestDefaultTripNameFromDestination } from '@/domain/trip-name';

function cloneItem(item: PackingItem): PackingItem {
  return { ...item };
}

/**
 * Trip input before normalization — legacy reads may omit nested packingLists/name.
 * Repository and assembly paths should pass through normalizeTrip before use.
 */
export type TripLike = Omit<Trip, 'name' | 'packingLists'> & {
  name?: string;
  packingLists?: PackingList[];
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
 * True when the trip is still on the temporary MP1 single-list compatibility path.
 * Used to fill deterministic ids on the primary list during normalization.
 */
function isLegacyCompatibilityShape(trip: TripLike): boolean {
  if (!trip.packingLists || trip.packingLists.length === 0) {
    return true;
  }

  if (trip.packingLists.length > 1) {
    return false;
  }

  return isCompatibilityPrimaryList(trip.id, trip.packingLists[0]);
}

/**
 * Normalize a trip to the target nested shape while keeping legacy mirrors in sync.
 *
 * Precedence:
 * - no packingLists → build deterministic primary list from legacy ingress fields
 * - compatibility or real nested lists present → primary PackingList is authoritative (MP1C+)
 * - legacy Trip.items / Trip.packingMode are mirrored on output only
 */
export function normalizeTrip(trip: TripLike): Trip {
  const name = resolveTripName(trip);
  const legacyItems = trip.items.map(cloneItem);
  const legacyPackingMode = trip.packingMode;

  let packingLists: PackingList[];

  if (!trip.packingLists || trip.packingLists.length === 0) {
    packingLists = [
      buildPrimaryPackingList(trip.id, trip.travelers, legacyPackingMode, legacyItems),
    ];
  } else if (isLegacyCompatibilityShape(trip)) {
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
  } else {
    packingLists = trip.packingLists.map(clonePackingList);
  }

  const primaryList = packingLists[0];

  return {
    ...trip,
    name,
    title: name,
    packingLists,
    items: primaryList.items.map(cloneItem),
    packingMode: primaryList.packingMode,
    generated: primaryList.packingMode === 'generated',
  };
}

/** Primary/default packing list — call on a normalized trip. */
export function getPrimaryPackingList(trip: Trip): PackingList {
  if (trip.packingLists.length === 0) {
    throw new Error('Trip has no packing lists');
  }

  return trip.packingLists[0];
}

/** Items for the compatibility single-list runtime (mirrors primary list). */
export function getTripPackingItems(trip: Trip): PackingItem[] {
  return getPrimaryPackingList(trip).items;
}

/** Packing mode for the compatibility single-list runtime (mirrors primary list). */
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

  return normalizeTrip({
    ...trip,
    packingLists: [updatedPrimary, ...trip.packingLists.slice(1).map(clonePackingList)],
    items: updatedPrimary.items,
    packingMode: updatedPrimary.packingMode,
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

/** Items for a specific packing list; throws when the list id is missing. */
export function getPackingListItems(trip: Trip, listId: string): PackingItem[] {
  const list = findPackingListById(trip, listId);
  if (!list) {
    throw new Error(`Packing list not found: ${listId}`);
  }

  return list.items;
}

export function findPackingItemInList(
  trip: Trip,
  listId: string,
  itemId: string,
): PackingItem | undefined {
  return getPackingListItems(trip, listId).find((item) => item.id === itemId);
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

  if (listId === getPrimaryPackingList(trip).id) {
    return normalizeTrip({ ...trip, packingLists: nextLists });
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
