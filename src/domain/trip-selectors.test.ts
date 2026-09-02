import { createDestinationFromText } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import { createStoredTripDraft } from '@/domain/trip-drafts-state';
import { buildTripsBrowseAllView, listPreviousTrips, listUpcomingTrips } from '@/domain/trip-selectors';

function createTestTrip(overrides: Partial<TripLike> & { id: string; endDate: string; startDate?: string }): Trip {
  const { endDate, startDate = '2026-06-01', ...rest } = overrides;

  return normalizeTrip({
    name: overrides.id,
    title: overrides.id,
    destination: createDestinationFromText('Tokyo'),
    startDate,
    endDate,
    tripContext: [],
    accommodation: 'hotel',
    laundry: 'no',
    travelers: [],
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
    status: 'upcoming',
    ...rest,
  });
}

describe('trip selectors', () => {
  const ref = new Date('2026-09-02');

  it('lists all upcoming trips nearest start date first', () => {
    const later = createTestTrip({ id: 'later', endDate: '2026-12-01', startDate: '2026-11-20' });
    const sooner = createTestTrip({ id: 'sooner', endDate: '2026-10-20', startDate: '2026-10-01' });

    expect(listUpcomingTrips([later, sooner], ref).map((trip) => trip.id)).toEqual(['sooner', 'later']);
  });

  it('lists all previous trips newest end date first', () => {
    const older = createTestTrip({ id: 'older', endDate: '2026-01-01' });
    const newer = createTestTrip({ id: 'newer', endDate: '2026-08-01' });

    expect(listPreviousTrips([older, newer], ref).map((trip) => trip.id)).toEqual(['newer', 'older']);
  });

  it('builds grouped All view without interleaving entity types', () => {
    const draft = createStoredTripDraft({ destination: createDestinationFromText('Draft') });
    const upcoming = createTestTrip({ id: 'upcoming', endDate: '2026-12-01' });
    const previous = createTestTrip({ id: 'previous', endDate: '2026-01-01' });

    const view = buildTripsBrowseAllView([draft], [upcoming, previous], ref);

    expect(view.drafts).toHaveLength(1);
    expect(view.upcoming.map((trip) => trip.id)).toEqual(['upcoming']);
    expect(view.previous.map((trip) => trip.id)).toEqual(['previous']);
  });
});
