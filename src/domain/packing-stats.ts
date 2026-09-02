import { PACKING_CATEGORY_ORDER, type PackingCategory } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { formatPackingListProfileName } from '@/domain/packing-list-display';
import {
  findPackingListById,
} from '@/domain/trip-compatibility';
import { isArchivedTrip } from '@/domain/trip-lifecycle';

export type PackingProgress = { packed: number; total: number; pct: number };

function progressFromItems(items: { packed: boolean }[]): PackingProgress {
  const packed = items.filter((item) => item.packed).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100);

  return { packed, total, pct };
}

/** Trip-level aggregate stats across all PackingLists (count-based, not averaged percentages). */
export function packingStatsForTrip(trip: Trip | null): PackingProgress {
  if (!trip) {
    return { packed: 0, total: 0, pct: 0 };
  }

  const allItems = trip.packingLists.flatMap((list) => list.items);
  return progressFromItems(allItems);
}

/** Trip-level stats — aggregate across all PackingLists. */
export function packingStats(trip: Trip | null): PackingProgress {
  return packingStatsForTrip(trip);
}

/** Pack-scoped stats for one active PackingList (MP3A). */
export function packingStatsForList(trip: Trip | null, listId: string | null): PackingProgress {
  if (!trip || !listId) {
    return { packed: 0, total: 0, pct: 0 };
  }

  const list = findPackingListById(trip, listId);
  if (!list) {
    return { packed: 0, total: 0, pct: 0 };
  }

  return progressFromItems(list.items);
}

export type PackingListProgressRow = {
  listId: string;
  profileName: string;
  packed: number;
  total: number;
  pct: number;
};

/** Per-PackingList progress rows for trip-level breakdown UI. */
export function packingListBreakdownForTrip(trip: Trip): PackingListProgressRow[] {
  return trip.packingLists.map((list) => {
    const stats = progressFromItems(list.items);
    return {
      listId: list.id,
      profileName: formatPackingListProfileName(list.profileSnapshot),
      ...stats,
    };
  });
}

export function shoppingCount(trip: Trip | null): number {
  if (!trip) {
    return 0;
  }

  return trip.packingLists
    .flatMap((list) => list.items)
    .filter((item) => item.needToBuy).length;
}

export type CategoryProgress = {
  category: PackingCategory;
  packed: number;
  total: number;
  pct: number;
};

function allTripItems(trip: Trip) {
  return trip.packingLists.flatMap((list) => list.items);
}

export function categoryBreakdown(trip: Trip): CategoryProgress[] {
  const items = allTripItems(trip);

  return PACKING_CATEGORY_ORDER.map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    const packed = categoryItems.filter((item) => item.packed).length;
    const total = categoryItems.length;

    return {
      category,
      packed,
      total,
      pct: total === 0 ? 0 : Math.round((packed / total) * 100),
    };
  }).filter((entry) => entry.total > 0);
}

export type TravelerProgress = {
  id: string;
  name: string;
  sub: string;
  shared: boolean;
  packed: number;
  total: number;
  pct: number;
};

export function travelerBreakdown(trip: Trip): TravelerProgress[] {
  const items = allTripItems(trip);

  const buckets: TravelerProgress[] = [
    ...trip.travelers.map((traveler) => {
      const travelerItems = items.filter((item) => item.assignedTo === traveler.id);
      const packed = travelerItems.filter((item) => item.packed).length;
      const total = travelerItems.length;

      return {
        id: traveler.id,
        name: traveler.name,
        sub: traveler.role,
        shared: false,
        packed,
        total,
        pct: total === 0 ? 0 : Math.round((packed / total) * 100),
      };
    }),
    (() => {
      const sharedItems = items.filter((item) => !item.assignedTo);
      const packed = sharedItems.filter((item) => item.packed).length;
      const total = sharedItems.length;

      return {
        id: 'shared',
        name: 'Shared',
        sub: 'Everyone',
        shared: true,
        packed,
        total,
        pct: total === 0 ? 0 : Math.round((packed / total) * 100),
      };
    })(),
  ];

  return buckets.filter((entry) => entry.total > 0);
}

export function findActiveTrip(trips: Trip[], activeTripId: string | null): Trip | null {
  if (!activeTripId) {
    return null;
  }

  const trip = trips.find((entry) => entry.id === activeTripId) ?? null;
  if (!trip || isArchivedTrip(trip)) {
    return null;
  }

  return trip;
}

/** Keeps activeTripId only when that trip exists and is not archived — never falls back to a seed/default trip. */
export function reconcileActiveTripId(
  activeTripId: string | null,
  trips: Trip[],
): string | null {
  if (!activeTripId) {
    return null;
  }

  const trip = trips.find((entry) => entry.id === activeTripId);
  if (!trip || isArchivedTrip(trip)) {
    return null;
  }

  return activeTripId;
}
