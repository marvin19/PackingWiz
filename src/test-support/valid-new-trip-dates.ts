import {
  startOfLocalCalendarDay,
  validateNewTripDateRange,
} from '@/domain/new-trip-date-validation';

export type TestTripDateRange = {
  startDate: string;
  endDate: string;
};

function formatIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ISO date range that passes {@link validateNewTripDateRange} for new-trip creation
 * when the reference calendar day is `referenceDate` (defaults to real "now").
 *
 * Use in provider/integration tests that call commit/reuse without injecting a clock.
 */
export function validNewTripDateRangeForTests(
  referenceDate: Date = new Date(),
  daysFromReference = 60,
  tripLengthDays = 9,
): TestTripDateRange {
  const start = startOfLocalCalendarDay(referenceDate);
  start.setDate(start.getDate() + daysFromReference);
  const end = startOfLocalCalendarDay(start);
  end.setDate(end.getDate() + tripLengthDays);

  const range: TestTripDateRange = {
    startDate: formatIsoDateLocal(start),
    endDate: formatIsoDateLocal(end),
  };

  const validation = validateNewTripDateRange(range.startDate, range.endDate, referenceDate);
  if (!validation.ok) {
    throw new Error(
      `validNewTripDateRangeForTests produced invalid range for reference ${referenceDate.toISOString()}: ${JSON.stringify(validation)}`,
    );
  }

  return range;
}
