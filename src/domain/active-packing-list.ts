import type { Trip } from '@/domain/trip';
import { getPrimaryPackingList } from '@/domain/trip-compatibility';

export type ActivePackingListResolution = {
  activePackingListId: string | null;
  /** Exactly one list on the trip — selection is automatic and authoritative. */
  autoResolved: boolean;
  /**
   * Multi-list trip with no explicit user selection yet (MP3B will prompt).
   * True when `usedPrimaryCompatibilityFallback` is set, or when no list could be resolved.
   */
  selectionRequired: boolean;
  /**
   * Temporary MP3A: primary list used so Pack has a safe target before MP3B picker exists.
   * MP3B should treat this differently from an explicit user choice.
   */
  usedPrimaryCompatibilityFallback: boolean;
};

function findListIdOnTrip(trip: Trip, listId: string): boolean {
  return trip.packingLists.some((list) => list.id === listId);
}

/**
 * Resolve which PackingList is active for the current trip.
 *
 * Scoped to `activeTripId` only — never carries a list id from another trip.
 * Pass `previousActivePackingListId` only when it belongs to the same trip being resolved.
 */
export function reconcileActivePackingListId(
  activeTripId: string | null,
  previousActivePackingListId: string | null,
  trips: Trip[],
  options?: { allowPrimaryCompatibilityFallback?: boolean },
): ActivePackingListResolution {
  const allowFallback = options?.allowPrimaryCompatibilityFallback ?? false;

  if (!activeTripId) {
    return {
      activePackingListId: null,
      autoResolved: false,
      selectionRequired: false,
      usedPrimaryCompatibilityFallback: false,
    };
  }

  const trip = trips.find((entry) => entry.id === activeTripId);
  if (!trip) {
    return {
      activePackingListId: null,
      autoResolved: false,
      selectionRequired: false,
      usedPrimaryCompatibilityFallback: false,
    };
  }

  const listCount = trip.packingLists.length;

  if (listCount === 0) {
    return {
      activePackingListId: null,
      autoResolved: false,
      selectionRequired: false,
      usedPrimaryCompatibilityFallback: false,
    };
  }

  if (listCount === 1) {
    return {
      activePackingListId: trip.packingLists[0].id,
      autoResolved: true,
      selectionRequired: false,
      usedPrimaryCompatibilityFallback: false,
    };
  }

  if (
    previousActivePackingListId &&
    findListIdOnTrip(trip, previousActivePackingListId)
  ) {
    return {
      activePackingListId: previousActivePackingListId,
      autoResolved: false,
      selectionRequired: false,
      usedPrimaryCompatibilityFallback: false,
    };
  }

  if (allowFallback) {
    const primaryId = getPrimaryPackingList(trip).id;
    return {
      activePackingListId: primaryId,
      autoResolved: false,
      selectionRequired: true,
      usedPrimaryCompatibilityFallback: true,
    };
  }

  return {
    activePackingListId: null,
    autoResolved: false,
    selectionRequired: true,
    usedPrimaryCompatibilityFallback: false,
  };
}
