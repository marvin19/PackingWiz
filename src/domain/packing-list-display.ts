import type { PackingList } from '@/domain/packing-list';
import type { PackingProfileSnapshot } from '@/domain/packing-profile';
import type { Trip } from '@/domain/trip';
import { packingStatsForList } from '@/domain/packing-stats';

/** Canonical person count for a Trip — one per PackingList / Packing Profile. */
export function getTripPackingPeopleCount(trip: Trip): number {
  return trip.packingLists.length;
}

export function formatTripPeopleCount(count: number): string {
  return count === 1 ? '1 person' : `${count} people`;
}

/** Display name for a packing list person (Me / Emilie). */
export function formatPackingListProfileName(snapshot: PackingProfileSnapshot): string {
  if (snapshot.isSelf) {
    return 'Me';
  }

  return snapshot.name;
}

/** Secondary line under the person name in list pickers. */
export function formatPackingListProfileSubtitle(snapshot: PackingProfileSnapshot): string | null {
  if (snapshot.isSelf) {
    return 'Your packing list';
  }

  if (snapshot.age !== undefined) {
    return `${snapshot.age} ${snapshot.age === 1 ? 'year' : 'years'}`;
  }

  return null;
}

/** Compact progress label for picker rows. */
export function formatPackingListProgress(trip: Trip, listId: string): string {
  const { packed, total } = packingStatsForList(trip, listId);
  return `${packed} / ${total} packed`;
}

export function formatPackingListPickerLabel(trip: Trip, list: PackingList): string {
  const name = formatPackingListProfileName(list.profileSnapshot);
  const progress = formatPackingListProgress(trip, list.id);
  return `${name}, ${progress}`;
}
