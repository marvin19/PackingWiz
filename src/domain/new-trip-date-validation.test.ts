import { createDestinationFromText } from '@/domain/destination';
import { applyTripSharedDetailsEdit } from '@/domain/trip-edit';
import type { TripSharedDetailsUserEdit } from '@/domain/trip-edit';
import { parseDate } from '@/domain/dates';
import {
  getNewTripDateValidationMessage,
  NEW_TRIP_START_DATE_PAST_MESSAGE,
  validateNewTripDateRange,
} from '@/domain/new-trip-date-validation';
import { isPreviousTrip } from '@/domain/trip-lifecycle';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';

function createTestTrip(overrides: Partial<TripLike> & { id: string }): Trip {
  return normalizeTrip({
    name: 'Paris',
    title: 'Paris',
    destination: createDestinationFromText('Paris', 'France'),
    startDate: '2026-05-08',
    endDate: '2026-05-12',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 18, low: 8 },
    insights: [],
    packingLists: [
      {
        id: primaryPackingListId(overrides.id),
        packingProfileId: 'profile-me',
        profileSnapshot: { id: 'profile-me', name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'past',
    ...overrides,
  });
}

describe('validateNewTripDateRange', () => {
  const ref = parseDate('2026-09-02');

  it('rejects start date before today', () => {
    expect(validateNewTripDateRange('2026-09-01', '2026-09-05', ref)).toEqual({
      ok: false,
      issue: 'start_before_today',
    });
    expect(getNewTripDateValidationMessage(validateNewTripDateRange('2026-09-01', '2026-09-05', ref))).toBe(
      NEW_TRIP_START_DATE_PAST_MESSAGE,
    );
  });

  it('accepts start date today and future', () => {
    expect(validateNewTripDateRange('2026-09-02', '2026-09-02', ref)).toEqual({ ok: true });
    expect(validateNewTripDateRange('2026-09-03', '2026-09-10', ref)).toEqual({ ok: true });
  });

  it('rejects end before start', () => {
    expect(validateNewTripDateRange('2026-09-10', '2026-09-05', ref)).toEqual({
      ok: false,
      issue: 'end_before_start',
    });
  });

  it('reports incomplete range', () => {
    expect(validateNewTripDateRange('', '2026-09-10', ref)).toEqual({
      ok: false,
      issue: 'incomplete',
    });
  });
});

describe('existing Previous trip regression', () => {
  const ref = parseDate('2026-09-02');

  it('allows historical dates on an existing Previous trip without new-trip validation', () => {
    const trip = createTestTrip({ id: 'paris' });
    expect(isPreviousTrip(trip, ref)).toBe(true);

    const patch: TripSharedDetailsUserEdit = {
      note: 'Updated note',
    };
    const after = applyTripSharedDetailsEdit(trip, patch);
    expect(after.startDate).toBe('2026-05-08');
    expect(after.endDate).toBe('2026-05-12');
  });

  it('does not treat historical trip dates as valid for NEW trip creation', () => {
    expect(validateNewTripDateRange('2026-05-08', '2026-05-12', ref).ok).toBe(false);
  });
});
