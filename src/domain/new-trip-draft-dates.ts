import { toIsoDate } from '@/domain/dates';
import { startOfLocalCalendarDay } from '@/domain/new-trip-date-validation';

export type NewTripDraftDateRange = {
  startDate: string;
  endDate: string;
};

/** Adds calendar days in local time (not fixed 24h) — avoids DST wall-clock drift. */
export function addLocalCalendarDays(day: Date, days: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days);
}

/** Default departure (today) and return (tomorrow) for a new trip creation session. */
export function createDefaultNewTripDateRange(
  referenceDate: Date = new Date(),
): NewTripDraftDateRange {
  const startDay = startOfLocalCalendarDay(referenceDate);
  const endDay = addLocalCalendarDays(startDay, 1);

  return {
    startDate: toIsoDate(startDay),
    endDate: toIsoDate(endDay),
  };
}

type DraftDateFields = {
  startDate: string;
  endDate: string;
};

/**
 * Applies default new-trip dates only when both fields are unset.
 * Preserves partial date entry (one field set, one empty) for resumed or in-flight edits.
 */
export function withDefaultNewTripDatesIfUnset<T extends DraftDateFields>(
  draft: T,
  referenceDate: Date = new Date(),
): T {
  const hasStart = Boolean(draft.startDate?.trim());
  const hasEnd = Boolean(draft.endDate?.trim());

  if (hasStart && hasEnd) {
    return draft;
  }

  if (hasStart || hasEnd) {
    return draft;
  }

  const defaults = createDefaultNewTripDateRange(referenceDate);
  return {
    ...draft,
    ...defaults,
  };
}