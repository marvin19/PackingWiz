import type { Destination } from '@/domain/destination';
import { emptyDestination, getDestinationLabel } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { resolveTripDisplayName } from '@/domain/trip-name-ownership';

/**
 * User-facing trip label (e.g. "Hyttetur") — distinct from the destination place
 * (e.g. "Norefjell, Norway").
 */
export type TripName = string;

type TripNameInput = Pick<Trip, 'name' | 'title'> &
  Partial<Pick<Trip, 'destination' | 'isTripNameUserEdited'>>;

/** Resolved user-facing trip label (custom or destination-owned). */
export function getTripName(trip: TripNameInput): string {
  return resolveTripDisplayName({
    name: trip.name ?? '',
    title: trip.title ?? '',
    destination: trip.destination ?? emptyDestination(),
    isTripNameUserEdited: trip.isTripNameUserEdited,
  });
}

/**
 * Fallback name when the user has not entered a trip name.
 * Matches current assembly behavior (destination label until explicit naming exists).
 */
export function suggestDefaultTripNameFromDestination(destination: Destination): string {
  return getDestinationLabel(destination) || 'New trip';
}
