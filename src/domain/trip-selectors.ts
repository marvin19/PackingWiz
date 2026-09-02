import {
  compareTripsByNearestStartDate,
  compareTripsByRecentEndDate,
  isPreviousTrip,
  isUpcomingTrip,
} from '@/domain/trip-lifecycle';
import type { StoredTripDraft } from '@/domain/trip-drafts-state';
import type { Trip } from '@/domain/trip';

/** All committed upcoming trips — nearest start date first. */
export function listUpcomingTrips(trips: Trip[], referenceDate: Date = new Date()): Trip[] {
  return trips
    .filter((trip) => isUpcomingTrip(trip, referenceDate))
    .sort(compareTripsByNearestStartDate);
}

/** All committed previous trips — most recent end date first. */
export function listPreviousTrips(trips: Trip[], referenceDate: Date = new Date()): Trip[] {
  return trips
    .filter((trip) => isPreviousTrip(trip, referenceDate))
    .sort(compareTripsByRecentEndDate);
}

/** @deprecated Use listUpcomingTrips — kept for Home imports during transition. */
export const listUpcomingTripsForHome = listUpcomingTrips;

/** @deprecated Use listPreviousTrips — kept for Home imports during transition. */
export const listPreviousTripsForHome = listPreviousTrips;

export type TripsBrowseAllView = {
  drafts: StoredTripDraft[];
  upcoming: Trip[];
  previous: Trip[];
};

/**
 * Grouped All-filter view: drafts (provider order) → upcoming → previous.
 * Does not interleave unrelated entity types.
 */
export function buildTripsBrowseAllView(
  drafts: StoredTripDraft[],
  trips: Trip[],
  referenceDate: Date = new Date(),
): TripsBrowseAllView {
  return {
    drafts,
    upcoming: listUpcomingTrips(trips, referenceDate),
    previous: listPreviousTrips(trips, referenceDate),
  };
}
