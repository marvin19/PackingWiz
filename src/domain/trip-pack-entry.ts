import { reconcileActivePackingListId } from '@/domain/active-packing-list';
import type { Trip } from '@/domain/trip';

export type TripPackEntryDestination = 'pack' | 'select-list';

export type TripPackEntryResolution = {
  destination: TripPackEntryDestination;
  activePackingListId: string | null;
};

/**
 * Resolve where Pack entry should land for a trip.
 * Never uses the MP3A primary-list compatibility fallback — multi-list trips
 * without a valid selection require the picker (MP3B).
 */
export function resolveTripPackEntry(
  tripId: string,
  previousTripId: string | null,
  previousListId: string | null,
  trips: Trip[],
  explicitListId?: string,
): TripPackEntryResolution {
  const trip = trips.find((entry) => entry.id === tripId);

  if (explicitListId && trip?.packingLists.some((list) => list.id === explicitListId)) {
    return { destination: 'pack', activePackingListId: explicitListId };
  }

  const carryListId = tripId === previousTripId ? previousListId : null;
  const resolved = reconcileActivePackingListId(tripId, carryListId, trips);

  if (resolved.activePackingListId) {
    return { destination: 'pack', activePackingListId: resolved.activePackingListId };
  }

  if (trip && trip.packingLists.length > 1) {
    return { destination: 'select-list', activePackingListId: null };
  }

  return { destination: 'pack', activePackingListId: resolved.activePackingListId };
}
