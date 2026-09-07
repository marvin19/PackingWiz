import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { seedLisbonWeather } from '@/mocks/seed-weather';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';

function createMinimalTrip(id: string) {
  const legacy: TripLike = {
    id,
    title: 'Smoke trip',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-09-01',
    endDate: '2026-09-05',
    tripContext: [],
    accommodation: 'hotel',
    laundry: 'unsure',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: seedLisbonWeather,
    packingLists: [
      {
        id: primaryPackingListId(id),
        packingProfileId: `${id}-profile-self`,
        profileSnapshot: {
          id: `${id}-profile-self`,
          name: 'Me',
          isSelf: true,
        },
        packingMode: 'manual',
        items: [],
      },
    ],
    items: [],
    insights: [],
    packingMode: 'manual',
    generated: false,
    status: 'upcoming',
  };

  return normalizeTrip(legacy);
}

describe('MockTripRepository session semantics', () => {
  it('does not survive repository reinstantiation (matches browser refresh in mock mode)', async () => {
    const trip = createMinimalTrip('trip-smoke');

    const sessionRepository = new MockTripRepository([]);
    await sessionRepository.createTrip(trip);
    expect(await sessionRepository.getAll()).toHaveLength(1);

    const afterRefreshRepository = new MockTripRepository([]);
    expect(await afterRefreshRepository.getAll()).toHaveLength(0);
  });
});
