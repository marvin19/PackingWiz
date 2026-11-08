import type { Destination } from '@/domain/destination';
import { getDestinationLabel, normalizeDestinationForPersist } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import type { TripSharedDetailsUserEdit } from '@/domain/trip-edit';

export const EDIT_TRIP_DESTINATION_REQUIRED_MESSAGE = 'Enter a destination.';

export const EDIT_TRIP_TRIP_CONTEXT_REQUIRED_MESSAGE =
  'Select at least one trip tag to save.';

export function isEditTripDestinationLabelValid(destination: Destination): boolean {
  return getDestinationLabel(destination).trim() !== '';
}

export function isEditTripTripContextValid(tripContext: string[]): boolean {
  return tripContext.length > 0;
}

export type EditTripSharedDetailsValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateEditTripDestinationInPatch(
  trip: Pick<Trip, 'destination'>,
  patch: TripSharedDetailsUserEdit,
): EditTripSharedDetailsValidationResult {
  if (patch.destination === undefined) {
    return { ok: true };
  }

  const normalized = normalizeDestinationForPersist(patch.destination);
  if (!isEditTripDestinationLabelValid(normalized)) {
    return { ok: false, message: EDIT_TRIP_DESTINATION_REQUIRED_MESSAGE };
  }

  return { ok: true };
}

export function validateEditTripTripContextInPatch(
  patch: TripSharedDetailsUserEdit,
): EditTripSharedDetailsValidationResult {
  if (patch.tripContext === undefined) {
    return { ok: true };
  }

  if (!isEditTripTripContextValid(patch.tripContext)) {
    return { ok: false, message: EDIT_TRIP_TRIP_CONTEXT_REQUIRED_MESSAGE };
  }

  return { ok: true };
}
