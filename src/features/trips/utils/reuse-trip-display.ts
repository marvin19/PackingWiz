import type { Trip } from '@/domain/trip';
import { getTripName } from '@/domain/trip-name';

export const REUSE_TRIP_SCREEN_TITLE = 'Reuse trip';
export const REUSE_TRIP_CTA_LABEL = 'Reuse trip';
export const REUSE_TRIP_ACTION_LABEL = 'Reuse trip';
export const REUSE_TRIP_EXPLANATION =
  'Packing items will be copied and packing progress will start fresh.';
export const REUSE_SELECT_PERSON_ERROR = 'Select at least one person.';

export function buildReuseTripMenuAccessibilityLabel(trip: Trip): string {
  return `Trip options for ${getTripName(trip)}`;
}

export function buildReuseTripActionAccessibilityLabel(trip: Trip): string {
  return `Reuse trip ${getTripName(trip)}`;
}
