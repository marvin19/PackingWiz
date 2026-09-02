import { isEndBeforeStart, parseDate } from '@/domain/dates';

export type NewTripDateValidationIssue =
  | 'incomplete'
  | 'start_before_today'
  | 'end_before_start';

export type NewTripDateValidationResult =
  | { ok: true }
  | { ok: false; issue: NewTripDateValidationIssue };

export const NEW_TRIP_START_DATE_PAST_MESSAGE = "Start date can't be in the past.";

export function startOfLocalCalendarDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isStartDateBeforeCalendarDay(startIso: string, referenceDate: Date): boolean {
  if (!startIso) {
    return false;
  }

  const startDay = startOfLocalCalendarDay(parseDate(startIso)).getTime();
  const referenceDay = startOfLocalCalendarDay(referenceDate).getTime();
  return startDay < referenceDay;
}

/** Validates date range for creating a NEW trip — not for editing existing historical trips. */
export function validateNewTripDateRange(
  startDate: string,
  endDate: string,
  referenceDate: Date = new Date(),
): NewTripDateValidationResult {
  if (!startDate || !endDate) {
    return { ok: false, issue: 'incomplete' };
  }

  if (isStartDateBeforeCalendarDay(startDate, referenceDate)) {
    return { ok: false, issue: 'start_before_today' };
  }

  if (isEndBeforeStart(startDate, endDate)) {
    return { ok: false, issue: 'end_before_start' };
  }

  return { ok: true };
}

export function getNewTripDateValidationMessage(
  result: NewTripDateValidationResult,
): string | null {
  if (result.ok) {
    return null;
  }

  switch (result.issue) {
    case 'start_before_today':
      return NEW_TRIP_START_DATE_PAST_MESSAGE;
    case 'end_before_start':
      return 'Return date must be on or after departure.';
    case 'incomplete':
      return null;
  }
}
