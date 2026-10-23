import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { getTripDetailsFactsFromTrip } from '@/features/trip-edit/utils/trip-details-facts';

function createTrip(overrides: Partial<TripLike> = {}) {
  return normalizeTrip({
    id: 'trip-facts-test',
    name: 'Hyttetur',
    title: 'Hyttetur',
    destination: createDestinationFromText('Norefjell', 'Norway'),
    startDate: '2027-01-10',
    endDate: '2027-01-17',
    tripContext: ['Skiing'],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: '', detail: '', high: 0, low: 0 },
    items: [],
    packingMode: 'manual',
    generated: false,
    packingLists: [
      {
        id: 'trip-facts-test-list',
        packingProfileId: 'profile-me',
        profileSnapshot: { id: 'profile-me', name: 'Me', isSelf: true },
        packingMode: 'manual',
        items: [],
      },
    ],
    status: 'upcoming',
    ...overrides,
  });
}

describe('getTripDetailsFactsFromTrip', () => {
  it('includes trip name and identity for the details hub hero', () => {
    const trip = createTrip();
    const facts = getTripDetailsFactsFromTrip(trip);

    expect(facts.tripNameLabel).toBe('Hyttetur');
    expect(facts.tripIdentity).toEqual({
      name: 'Hyttetur',
      title: 'Hyttetur',
      destination: trip.destination,
    });
  });
});
