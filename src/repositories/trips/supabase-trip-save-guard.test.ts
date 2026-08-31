import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  assertSupabaseTripSaveSupported,
  SUPABASE_MULTI_LIST_SAVE_ERROR,
} from '@/repositories/trips/supabase-trip-save-guard';

function createTrip(listCount: 1 | 2, name = 'Trip'): Trip {
  const tripId = `trip-guard-${listCount}`;
  const primaryList = {
    id: primaryPackingListId(tripId),
    packingProfileId: `${tripId}-profile-self`,
    profileSnapshot: {
      id: `${tripId}-profile-self`,
      name: 'Me',
      isSelf: true,
    },
    packingMode: 'generated' as const,
    items: [],
  };

  const lists =
    listCount === 1
      ? [primaryList]
      : [
          primaryList,
          {
            id: `${tripId}-list-secondary`,
            packingProfileId: `${tripId}-profile-emilie`,
            profileSnapshot: {
              id: `${tripId}-profile-emilie`,
              name: 'Emilie',
              isSelf: false,
            },
            packingMode: 'manual' as const,
            items: [],
          },
        ];

  const input: TripLike = {
    id: tripId,
    name,
    title: name,
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'yes',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: {
      mode: 'climate',
      summary: 'Fixture',
      detail: '',
      high: 20,
      low: 10,
    },
    packingLists: lists,
    items: [],
    insights: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };

  return normalizeTrip(input);
}

describe('assertSupabaseTripSaveSupported', () => {
  it('A/B. allows single-list metadata-only save when list count is unchanged', () => {
    const existing = createTrip(1);
    const updated = normalizeTrip({
      ...existing,
      name: 'Renamed trip',
      destination: createDestinationFromText('Bergen', 'Norway'),
      note: 'Updated note',
    });

    expect(() => assertSupabaseTripSaveSupported(existing, updated)).not.toThrow();
  });

  it('C. rejects multi-list metadata-only save because flat schema cannot round-trip lists', () => {
    const existing = createTrip(2);
    const updated = normalizeTrip({
      ...existing,
      name: 'Renamed multi-list trip',
      note: 'Metadata only',
    });

    expect(() => assertSupabaseTripSaveSupported(existing, updated)).toThrow(
      SUPABASE_MULTI_LIST_SAVE_ERROR,
    );
  });

  it('D. rejects multi-list add/remove traveller saves', () => {
    const existing = createTrip(2);
    const removedOneList = normalizeTrip({
      ...existing,
      packingLists: [existing.packingLists[0]],
      travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    });

    expect(() => assertSupabaseTripSaveSupported(existing, removedOneList)).toThrow(
      SUPABASE_MULTI_LIST_SAVE_ERROR,
    );
  });

  it('E. rejects ordinary multi-list save even when list counts match', () => {
    const existing = createTrip(2);
    const sameShape = normalizeTrip({ ...existing, insights: ['New insight'] });

    expect(() => assertSupabaseTripSaveSupported(existing, sameShape)).toThrow(
      SUPABASE_MULTI_LIST_SAVE_ERROR,
    );
  });

  it('rejects single-list save when list count increases', () => {
    const existing = createTrip(1);
    const multi = createTrip(2);
    multi.id = existing.id;

    expect(() => assertSupabaseTripSaveSupported(existing, multi)).toThrow(
      SUPABASE_MULTI_LIST_SAVE_ERROR,
    );
  });
});
