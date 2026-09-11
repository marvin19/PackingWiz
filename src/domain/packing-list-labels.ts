import { formatAgeYears } from '@/domain/count-display';
import type { PackingProfileSnapshot } from '@/domain/packing-profile';
import type { Trip } from '@/domain/trip';

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
    return formatAgeYears(snapshot.age);
  }

  return null;
}
