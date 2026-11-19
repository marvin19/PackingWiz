import { createDestinationFromText } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { TripEditError } from '@/domain/trip-edit';
import { deriveTripDateBucket, referenceDateFromIso } from '@/domain/trip-lifecycle';
import {
  assertTripAllowsMutation,
  isTripReadOnly,
} from '@/domain/trip-mutation-policy';

function createTrip(overrides: Partial<TripLike> & { id: string }): Trip {
  const listId = primaryPackingListId(overrides.id);
  return normalizeTrip({
    name: 'Policy test',
    title: 'Policy test',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-06-01',
    endDate: '2026-06-10',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'yes',
    note: '',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 10 },
    insights: [],
    packingLists: [
      {
        id: listId,
        packingProfileId: 'profile-self',
        profileSnapshot: { id: 'profile-self', name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
    ...overrides,
  });
}

describe('trip mutation policy (PW-004E-A)', () => {
  const ref = referenceDateFromIso('2026-09-02');

  it('treats trips with end date before reference day as read-only', () => {
    const trip = createTrip({ id: 'past', endDate: '2026-09-01' });
    expect(isTripReadOnly(trip, ref)).toBe(true);
    expect(() => assertTripAllowsMutation(trip, ref)).toThrow(TripEditError);
    expect(() => assertTripAllowsMutation(trip, ref)).toThrow(
      expect.objectContaining({ code: 'TRIP_READ_ONLY' }),
    );
  });

  it('keeps trips ending on the reference day editable', () => {
    const trip = createTrip({ id: 'today', endDate: '2026-09-02' });
    expect(isTripReadOnly(trip, ref)).toBe(false);
    expect(() => assertTripAllowsMutation(trip, ref)).not.toThrow();
  });

  it('keeps future-ending trips editable', () => {
    const trip = createTrip({ id: 'future', endDate: '2026-12-01' });
    expect(isTripReadOnly(trip, ref)).toBe(false);
  });

  it('does not treat missing or invalid end dates as read-only', () => {
    expect(isTripReadOnly(createTrip({ id: 'no-end', endDate: '' }), ref)).toBe(false);
    expect(isTripReadOnly(createTrip({ id: 'bad', endDate: 'not-a-date' }), ref)).toBe(false);
  });

  it('ignores persisted status when classifying read-only', () => {
    const trip = createTrip({ id: 'past-status', endDate: '2026-08-01', status: 'upcoming' });
    expect(isTripReadOnly(trip, ref)).toBe(true);
    expect(deriveTripDateBucket(trip, ref)).toBe('past');
  });
});