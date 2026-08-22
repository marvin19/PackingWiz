import type { Destination } from '@/domain/destination';
import { getDestinationLabel } from '@/domain/destination';
import type { Trip } from '@/domain/trip';

/**
 * User-facing trip label (e.g. "Hyttetur") — distinct from the destination place
 * (e.g. "Norefjell, Norway"). Legacy trips store this in `Trip.title`; MP1B will
 * introduce `Trip.name` and migrate callers off `title`.
 */
export type TripName = string;

/** Read the trip's display name from the current legacy `title` field. */
export function getTripName(trip: Pick<Trip, 'title'>): string {
  return trip.title.trim();
}

/**
 * Fallback name when the user has not entered a trip name.
 * Matches current assembly behavior (`assembleTripFromDraft` copies destination label).
 */
export function suggestDefaultTripNameFromDestination(destination: Destination): string {
  return getDestinationLabel(destination) || 'New trip';
}
