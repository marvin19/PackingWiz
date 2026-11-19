import { TripEditError } from '@/domain/trip-edit';
import { hasValidTripEndDateForLifecycle, isPreviousTrip } from '@/domain/trip-lifecycle';
import type { Trip } from '@/domain/trip';

const TRIP_READ_ONLY_MESSAGE =
  'This trip has ended and can no longer be edited.';

export { hasValidTripEndDateForLifecycle };

/**
 * Completed-trip read-only rule (PW-004E): end date strictly before the reference local day.
 * Ignores persisted `trip.status`. Invalid or missing end dates remain editable.
 */
export function isTripReadOnly(trip: Trip, referenceDate: Date = new Date()): boolean {
  if (!hasValidTripEndDateForLifecycle(trip)) {
    return false;
  }

  return isPreviousTrip(trip, referenceDate);
}

export function assertTripAllowsMutation(trip: Trip, referenceDate: Date = new Date()): void {
  if (isTripReadOnly(trip, referenceDate)) {
    throw new TripEditError(TRIP_READ_ONLY_MESSAGE, 'TRIP_READ_ONLY');
  }
}