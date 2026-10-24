import { isEndBeforeStart } from '@/domain/dates';
import type { Trip } from '@/domain/trip';
import type { TripSharedDetailsUserEdit } from '@/domain/trip-edit';

export type EditTripDateValidationIssue = 'incomplete' | 'end_before_start';

export type EditTripDateValidationResult =
  | { ok: true }
  | { ok: false; issue: EditTripDateValidationIssue };

export const EDIT_TRIP_END_BEFORE_START_MESSAGE = 'Return date must be on or after departure.';
export const EDIT_TRIP_INCOMPLETE_DATE_RANGE_MESSAGE = 'Enter departure and return dates.';

/** Validates date range when editing an existing trip (past start dates allowed). */
export function validateEditTripDateRange(
  startDate: string,
  endDate: string,
): EditTripDateValidationResult {
  if (!startDate || !endDate) {
    return { ok: false, issue: 'incomplete' };
  }

  if (isEndBeforeStart(startDate, endDate)) {
    return { ok: false, issue: 'end_before_start' };
  }

  return { ok: true };
}

export function getEditTripDateValidationMessage(
  result: EditTripDateValidationResult,
): string | null {
  if (result.ok) {
    return null;
  }

  switch (result.issue) {
    case 'end_before_start':
      return EDIT_TRIP_END_BEFORE_START_MESSAGE;
    case 'incomplete':
      return EDIT_TRIP_INCOMPLETE_DATE_RANGE_MESSAGE;
  }
}

export function resolveDatesAfterSharedDetailsPatch(
  trip: Pick<Trip, 'startDate' | 'endDate'>,
  patch: TripSharedDetailsUserEdit,
): { startDate: string; endDate: string } {
  return {
    startDate: patch.startDate ?? trip.startDate,
    endDate: patch.endDate ?? trip.endDate,
  };
}

/** Validates the trip date range that would result from applying a shared-details patch. */
export function validateEditTripSharedDetailsDates(
  trip: Pick<Trip, 'startDate' | 'endDate'>,
  patch: TripSharedDetailsUserEdit,
): EditTripDateValidationResult {
  const { startDate, endDate } = resolveDatesAfterSharedDetailsPatch(trip, patch);
  return validateEditTripDateRange(startDate, endDate);
}
