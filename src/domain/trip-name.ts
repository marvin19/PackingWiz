import type { Destination } from '@/domain/destination';
import { getDestinationLabel } from '@/domain/destination';
import type { Trip } from '@/domain/trip';

/**
 * User-facing trip label (e.g. "Hyttetur") — distinct from the destination place
 * (e.g. "Norefjell, Norway").
 */
export type TripName = string;

/** Read the trip's display name. Prefers trimmed `name`; falls back to trimmed legacy `title`. */
export function getTripName(trip: Pick<Trip, 'name' | 'title'>): string {
  const name = trip.name?.trim();
  if (name) {
    return name;
  }

  return trip.title?.trim() ?? '';
}

/**
 * Fallback name when the user has not entered a trip name.
 * Matches current assembly behavior (destination label until explicit naming exists).
 */
export function suggestDefaultTripNameFromDestination(destination: Destination): string {
  return getDestinationLabel(destination) || 'New trip';
}
