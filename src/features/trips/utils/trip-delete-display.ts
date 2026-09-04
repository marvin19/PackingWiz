import { getDestinationLabel } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';

export const DELETE_TRIP_PERMANENTLY_TITLE = 'Delete this trip permanently?';
export const DELETE_TRIP_PERMANENTLY_BODY =
  'This will permanently delete this trip and its packing lists. Saved Packing Profiles and their reusable Important items will not be deleted.';
export const DELETE_TRIP_PERMANENTLY_ACTION = 'Delete permanently';

export function getPreviousTripPrimaryLabel(trip: Trip): string {
  const tripName = getTripName(trip).trim();
  if (tripName.length > 0) {
    return tripName;
  }

  const destination = getDestinationLabel(trip.destination).trim();
  return destination.length > 0 ? destination : 'Trip';
}

export function buildDeleteTripPermanentlyAccessibilityLabel(trip: Trip): string {
  return `Delete ${getPreviousTripPrimaryLabel(trip)} trip permanently`;
}

export function buildPreviousTripMenuAccessibilityLabel(trip: Trip): string {
  return `More options for ${getPreviousTripPrimaryLabel(trip)} trip`;
}
