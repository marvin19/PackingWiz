import { createDestinationFromText } from '@/domain/destination';
import {
  formatTripPeopleCount,
  getTripPackingPeopleCount,
} from '@/domain/packing-list-display';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';

function createTripWithListCount(listCount: number) {
  const tripId = 'trip-people-count';
  const packingLists = Array.from({ length: listCount }, (_, index) => ({
    id: index === 0 ? primaryPackingListId(tripId) : `${tripId}-list-${index}`,
    packingProfileId: index === 0 ? `${tripId}-profile-self` : `profile-${index}`,
    profileSnapshot: {
      id: index === 0 ? `${tripId}-profile-self` : `profile-${index}`,
      name: index === 0 ? 'Me' : `Person ${index}`,
      isSelf: index === 0,
    },
    packingMode: 'generated' as const,
    items: [],
  }));

  const input: TripLike = {
    id: tripId,
    name: 'Sample trip',
    title: 'Sample trip',
    destination: createDestinationFromText('Lisbon', 'Portugal'),
    startDate: '2026-10-12',
    endDate: '2026-10-26',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'yes',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 20, low: 10 },
    packingLists,
    items: [],
    insights: [],
    packingMode: 'generated',
    generated: true,
    status: 'upcoming',
  };

  return normalizeTrip(input);
}

describe('trip people count display', () => {
  it('formats singular and plural people labels', () => {
    expect(formatTripPeopleCount(1)).toBe('1 person');
    expect(formatTripPeopleCount(2)).toBe('2 people');
  });

  it('uses packing list count as canonical person count', () => {
    expect(getTripPackingPeopleCount(createTripWithListCount(1))).toBe(1);
    expect(getTripPackingPeopleCount(createTripWithListCount(2))).toBe(2);
  });
});
