import { parseDate } from '@/domain/dates';
import {
  NEW_TRIP_START_DATE_PAST_MESSAGE,
  getNewTripDateValidationMessage,
  validateNewTripDateRange,
} from '@/domain/new-trip-date-validation';
import { validNewTripDateRangeForTests } from '@/test-support/valid-new-trip-dates';

describe('validNewTripDateRangeForTests', () => {
  it('returns a range that passes new-trip validation for the same reference day', () => {
    const referenceDate = parseDate('2026-10-23');
    const range = validNewTripDateRangeForTests(referenceDate);

    expect(validateNewTripDateRange(range.startDate, range.endDate, referenceDate)).toEqual({
      ok: true,
    });
  });

  it('does not return dates that were hard-coded in the past relative to a later reference', () => {
    const referenceDate = parseDate('2026-10-23');
    const range = validNewTripDateRangeForTests(referenceDate);

    expect(
      getNewTripDateValidationMessage(
        validateNewTripDateRange('2026-10-01', '2026-10-10', referenceDate),
      ),
    ).toBe(NEW_TRIP_START_DATE_PAST_MESSAGE);

    expect(validateNewTripDateRange(range.startDate, range.endDate, referenceDate)).toEqual({
      ok: true,
    });
  });
});
