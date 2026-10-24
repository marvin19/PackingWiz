import { parseDate } from '@/domain/dates';
import {
  EDIT_TRIP_END_BEFORE_START_MESSAGE,
  getEditTripDateValidationMessage,
  validateEditTripDateRange,
  validateEditTripSharedDetailsDates,
} from '@/domain/edit-trip-date-validation';
import { validateNewTripDateRange } from '@/domain/new-trip-date-validation';

describe('validateEditTripDateRange', () => {
  it('accepts historical start dates for existing trips', () => {
    expect(validateEditTripDateRange('2026-05-08', '2026-05-12')).toEqual({ ok: true });
  });

  it('rejects end date before start date', () => {
    expect(validateEditTripDateRange('2026-09-10', '2026-09-05')).toEqual({
      ok: false,
      issue: 'end_before_start',
    });
    expect(
      getEditTripDateValidationMessage(
        validateEditTripDateRange('2026-09-10', '2026-09-05'),
      ),
    ).toBe(EDIT_TRIP_END_BEFORE_START_MESSAGE);
  });

  it('rejects incomplete ranges', () => {
    expect(validateEditTripDateRange('', '2026-09-10')).toEqual({
      ok: false,
      issue: 'incomplete',
    });
  });
});

describe('validateEditTripSharedDetailsDates', () => {
  const trip = { startDate: '2026-05-08', endDate: '2026-05-12' };

  it('still validates unchanged dates when the patch does not touch dates', () => {
    expect(validateEditTripSharedDetailsDates(trip, { name: 'Renamed' })).toEqual({ ok: true });
  });

  it('validates merged dates when the patch changes one bound', () => {
    expect(
      validateEditTripSharedDetailsDates(trip, { endDate: '2026-05-05' }),
    ).toEqual({
      ok: false,
      issue: 'end_before_start',
    });
  });
});

describe('new-trip validation regression', () => {
  const ref = parseDate('2026-09-02');

  it('still rejects past start dates for new trips', () => {
    expect(validateNewTripDateRange('2026-05-08', '2026-05-12', ref).ok).toBe(false);
    expect(
      validateNewTripDateRange('2026-05-08', '2026-05-12', ref),
    ).toEqual({
      ok: false,
      issue: 'start_before_today',
    });
  });

  it('edit validation accepts the same historical range', () => {
    expect(validateEditTripDateRange('2026-05-08', '2026-05-12').ok).toBe(true);
    expect(validateNewTripDateRange('2026-05-08', '2026-05-12', ref).ok).toBe(false);
  });
});
