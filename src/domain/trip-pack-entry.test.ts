import { resolveTripPackEntry } from '@/domain/trip-pack-entry';
import { createDestinationFromText } from '@/domain/destination';
import type { Trip } from '@/domain/trip';

const TRIP_ID = 'trip-pack-entry';

function createMultiListTrip(): Trip {
  return {
    id: TRIP_ID,
    name: 'Trip',
    title: 'Trip',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    tripContext: ['Vacation'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [],
    bags: [],
    note: '',
    weather: {
      mode: 'climate',
      summary: 'Fixture',
      detail: '',
      high: 20,
      low: 10,
    },
    packingLists: [
      {
        id: 'list-me',
        packingProfileId: 'profile-me',
        profileSnapshot: { id: 'profile-me', name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [],
      },
      {
        id: 'list-emilie',
        packingProfileId: 'profile-emilie',
        profileSnapshot: { id: 'profile-emilie', name: 'Emilie', isSelf: false },
        packingMode: 'manual',
        items: [],
      },
    ],
    items: [],
    insights: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };
}

describe('resolveTripPackEntry bootstrap contract', () => {
  it('never auto-selects the first packing list on a multi-list trip', () => {
    const trip = createMultiListTrip();
    const entry = resolveTripPackEntry(TRIP_ID, null, null, [trip]);

    expect(entry.destination).toBe('select-list');
    expect(entry.activePackingListId).toBeNull();
    expect(entry.activePackingListId).not.toBe('list-me');
  });

  it('auto-resolves the sole list on a single-list trip', () => {
    const trip = createMultiListTrip();
    trip.packingLists = [trip.packingLists[0]!];

    const entry = resolveTripPackEntry(TRIP_ID, null, null, [trip]);

    expect(entry.destination).toBe('pack');
    expect(entry.activePackingListId).toBe('list-me');
  });
});
