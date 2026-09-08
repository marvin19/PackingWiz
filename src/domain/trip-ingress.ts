import type { PackingList } from '@/domain/packing-list';
import { isCompatibilityPrimaryList } from '@/domain/trip-compatibility-primary';

/** True when trip input still uses flat/single-list compatibility ingress. */
export function isLegacyTripIngress(trip: {
  id: string;
  packingLists?: PackingList[];
}): boolean {
  if (!trip.packingLists || trip.packingLists.length === 0) {
    return true;
  }

  if (trip.packingLists.length === 1) {
    return isCompatibilityPrimaryList(trip.id, trip.packingLists[0]);
  }

  return false;
}
