import {
  formatTripCardLocationLine,
  getDestinationCountryLabel,
  getDestinationLabel,
} from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';

function normalizeForIdentityCompare(value: string): string {
  return value.trim().toLowerCase();
}

function identityTextEquals(left: string, right: string): boolean {
  return normalizeForIdentityCompare(left) === normalizeForIdentityCompare(right);
}

/** Mirrors formatTripCardLocationLine place+country pairing without parsing formatted strings. */
function structuredPlaceCountryLine(place: string, country: string): string | null {
  if (!place || !country) {
    return null;
  }

  if (place.toLowerCase().includes(country.toLowerCase())) {
    return null;
  }

  return `${place}, ${country}`;
}

/**
 * Secondary location line for trip headers/cards when it adds information beyond the primary title.
 * Suppresses exact duplicates of the formatted destination; when the title matches the place
 * only, shows the distinct country (structured fields — never comma-splits the formatted line).
 */
export function getTripSecondaryLocationLine(
  trip: Pick<Trip, 'name' | 'title' | 'destination' | 'isTripNameUserEdited'>,
): string {
  const locationLine = formatTripCardLocationLine(trip.destination);
  if (!locationLine) {
    return '';
  }

  const tripName = getTripName(trip);
  if (identityTextEquals(tripName, locationLine)) {
    return '';
  }

  const place = getDestinationLabel(trip.destination);
  const country = getDestinationCountryLabel(trip.destination);
  const placeCountryLine = structuredPlaceCountryLine(place, country);

  if (
    placeCountryLine &&
    identityTextEquals(placeCountryLine, locationLine) &&
    identityTextEquals(tripName, place)
  ) {
    return country;
  }

  return locationLine;
}

export function formatTripIdentityAccessibilityLabel(
  trip: Pick<Trip, 'name' | 'title' | 'destination' | 'isTripNameUserEdited'>,
): string {
  const tripName = getTripName(trip);
  const locationLine = getTripSecondaryLocationLine(trip);
  return locationLine ? `${tripName}, ${locationLine}` : tripName;
}