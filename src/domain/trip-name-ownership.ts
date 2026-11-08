import { getDestinationLabel } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { suggestDefaultTripNameFromDestination } from '@/domain/trip-name';

/**
 * Legacy inference when `isTripNameUserEdited` was never persisted.
 * Conservative: matching destination label → automatic; otherwise custom.
 */
export function inferTripNameUserEdited(
  trip: Pick<Trip, 'name' | 'title' | 'destination'>,
): boolean {
  const stored = trip.name?.trim() || trip.title?.trim() || '';
  if (!stored) {
    return false;
  }

  const destinationLabel = getDestinationLabel(trip.destination);
  if (
    destinationLabel &&
    stored.localeCompare(destinationLabel, undefined, { sensitivity: 'accent' }) === 0
  ) {
    return false;
  }

  return true;
}

/** Apply stored flag when present; infer only when `isTripNameUserEdited` is undefined. */
export function coalesceTripNameOwnership<T extends Pick<Trip, 'isTripNameUserEdited'>>(
  trip: T &
    Pick<Trip, 'name' | 'title' | 'destination'> & {
      isTripNameUserEdited?: boolean;
    },
): T & { isTripNameUserEdited: boolean } {
  if (trip.isTripNameUserEdited !== undefined) {
    return { ...trip, isTripNameUserEdited: trip.isTripNameUserEdited };
  }

  return {
    ...trip,
    isTripNameUserEdited: inferTripNameUserEdited(trip),
  };
}

/** User-facing title on cards, Pack, Trip Details, and persistence `title` column. */
export function resolveTripDisplayName(
  trip: Pick<Trip, 'name' | 'title' | 'destination' | 'isTripNameUserEdited'>,
): string {
  const ownership = coalesceTripNameOwnership(trip);

  if (ownership.isTripNameUserEdited) {
    const custom = trip.name?.trim() || trip.title?.trim();
    if (custom) {
      return custom;
    }
  }

  return suggestDefaultTripNameFromDestination(trip.destination);
}

export function resolveTripNameCustomText(
  trip: Pick<Trip, 'name' | 'title' | 'isTripNameUserEdited'>,
): string {
  if (!trip.isTripNameUserEdited) {
    return '';
  }

  return trip.name?.trim() || trip.title?.trim() || '';
}

export function tripNameEditState(
  trip: Pick<Trip, 'name' | 'title' | 'destination' | 'isTripNameUserEdited'>,
): { isTripNameUserEdited: boolean; customName: string } {
  const ownership = coalesceTripNameOwnership(trip);
  return {
    isTripNameUserEdited: ownership.isTripNameUserEdited,
    customName: ownership.isTripNameUserEdited ? resolveTripNameCustomText(ownership) : '',
  };
}

/** `title` column / legacy mirror — always the resolved display line. */
export function resolveTripPersistenceTitle(
  trip: Pick<Trip, 'name' | 'title' | 'destination' | 'isTripNameUserEdited'>,
): string {
  return resolveTripDisplayName(trip);
}

/** Canonical `Trip.name` storage: empty when destination-owned; custom text when user-edited. */
export function resolveTripCanonicalStoredName(
  trip: Pick<Trip, 'name' | 'title' | 'destination' | 'isTripNameUserEdited'>,
): string {
  const ownership = coalesceTripNameOwnership(trip);
  if (!ownership.isTripNameUserEdited) {
    return '';
  }

  return resolveTripNameCustomText(ownership);
}
