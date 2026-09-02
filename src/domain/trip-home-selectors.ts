import {
  classifyTripLifecycle,
  compareTripsByRecentEndDate,
  isArchivedTrip,
} from '@/domain/trip-lifecycle';
import type { Trip } from '@/domain/trip';

/** Home Upcoming section — non-archived trips whose end date is today or later. */
export function listUpcomingTripsForHome(trips: Trip[], referenceDate: Date = new Date()): Trip[] {
  return trips.filter((trip) => classifyTripLifecycle(trip, referenceDate) === 'upcoming');
}

/** Home Previous section — non-archived trips whose end date is before today, newest first. */
export function listPreviousTripsForHome(trips: Trip[], referenceDate: Date = new Date()): Trip[] {
  return trips
    .filter((trip) => classifyTripLifecycle(trip, referenceDate) === 'past')
    .sort(compareTripsByRecentEndDate);
}

/** Archived trips for future manage/archive surfaces — newest end date first. */
export function listArchivedTrips(trips: Trip[]): Trip[] {
  return trips.filter((trip) => isArchivedTrip(trip)).sort(compareTripsByRecentEndDate);
}

/** Committed trips visible on Home (Upcoming + Previous). */
export function listHomeVisibleTrips(trips: Trip[], referenceDate: Date = new Date()): Trip[] {
  return trips.filter((trip) => !isArchivedTrip(trip));
}
