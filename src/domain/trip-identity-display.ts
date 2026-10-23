import { formatTripCardLocationLine } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';

/**
 * Secondary location line for trip headers/cards when it adds information beyond the primary title.
 * Omits redundant text when the trip name already matches the formatted destination line.
 */
export function getTripSecondaryLocationLine(
  trip: Pick<Trip, 'name' | 'title' | 'destination'>,
): string {
  const locationLine = formatTripCardLocationLine(trip.destination);
  if (!locationLine) {
    return '';
  }

  const tripName = getTripName(trip);
  if (tripName.toLowerCase() === locationLine.toLowerCase()) {
    return '';
  }

  return locationLine;
}

export function formatTripIdentityAccessibilityLabel(
  trip: Pick<Trip, 'name' | 'title' | 'destination'>,
): string {
  const tripName = getTripName(trip);
  const locationLine = getTripSecondaryLocationLine(trip);
  return locationLine ? `${tripName}, ${locationLine}` : tripName;
}
