import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { isUpcomingTrip } from '@/domain/trip-lifecycle';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { buildReuseTripHref } from '@/features/trips/utils/reuse-trip-navigation';
import { REUSE_TRIP_ACTION_LABEL } from '@/features/trips/utils/reuse-trip-display';

function createCommittedTrip(id: string, endDate: string): Trip {
  return normalizeTrip({
    id,
    name: id,
    title: id,
    destination: createDestinationFromText('Oslo'),
    startDate: '2026-10-01',
    endDate,
    tripContext: [],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [],
    note: '',
    weather: { mode: 'climate', summary: 'Mild', detail: '', high: 18, low: 8 },
    insights: [],
    packingLists: [
      {
        id: primaryPackingListId(id),
        packingProfileId: `${id}-profile-self`,
        profileSnapshot: { id: `${id}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: `${id}-item`,
            name: 'Shirt',
            quantity: 1,
            category: 'Clothing',
            packed: true,
            needToBuy: false,
            assignedTo: null,
            source: 'generated',
          },
        ],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: endDate >= '2026-09-04' ? 'upcoming' : 'past',
  } satisfies Partial<TripLike> & { id: string });
}

describe('committed trip management browse behavior', () => {
  const referenceDate = new Date('2026-09-04T12:00:00');

  it('uses the same reuse route for Upcoming and Previous source trips', () => {
    const upcoming = createCommittedTrip('trip-upcoming-mgmt', '2026-12-01');
    const previous = createCommittedTrip('trip-previous-mgmt', '2026-08-01');

    expect(isUpcomingTrip(upcoming, referenceDate)).toBe(true);
    expect(isUpcomingTrip(previous, referenceDate)).toBe(false);
    expect(String(buildReuseTripHref(upcoming.id))).toBe('/trip/reuse?tripId=trip-upcoming-mgmt');
    expect(String(buildReuseTripHref(previous.id))).toBe('/trip/reuse?tripId=trip-previous-mgmt');
  });

  it('uses Reuse trip as the shared overflow action label', () => {
    expect(REUSE_TRIP_ACTION_LABEL).toBe('Reuse trip');
  });
});
