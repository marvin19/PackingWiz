import { createDestinationFromText } from '@/domain/destination';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  buildViewAllPreviousTripsLabel,
  getHomePreviousPreview,
} from '@/features/trips/utils/previous-home-preview';
import { parseTripsBrowseFilter } from '@/features/trips/utils/trips-browse-filter';
import { buildTripsBrowseHref } from '@/features/trips/utils/trips-browse-navigation';
import {
  MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL,
  MANAGE_ALL_TRIPS_LABEL,
} from '@/features/trips/components/home-view-all-link';

function createPreviousTrip(id: string, endDate: string): Trip {
  return normalizeTrip({
    id,
    name: id,
    title: id,
    destination: createDestinationFromText('Oslo'),
    startDate: '2026-01-01',
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
        id: primaryPackingListId(id),
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
  } satisfies Partial<TripLike> & { id: string });
}

describe('previous home preview', () => {
  const ref = new Date('2026-09-02');

  it('returns empty preview for zero previous trips', () => {
    const upcoming = createPreviousTrip('future', '2026-12-01');
    const preview = getHomePreviousPreview([upcoming], 2, ref);
    expect(preview.totalCount).toBe(0);
    expect(preview.visibleTrips).toEqual([]);
    expect(preview.hasMore).toBe(false);
  });

  it('shows one previous trip when only one exists', () => {
    const only = createPreviousTrip('only', '2026-08-01');
    const preview = getHomePreviousPreview([only], 2, ref);
    expect(preview.visibleTrips).toHaveLength(1);
    expect(preview.hasMore).toBe(false);
  });

  it('shows two previous trips when two exist', () => {
    const trips = [
      createPreviousTrip('a', '2026-08-01'),
      createPreviousTrip('b', '2026-07-01'),
    ];
    const preview = getHomePreviousPreview(trips, 2, ref);
    expect(preview.visibleTrips).toHaveLength(2);
    expect(preview.hasMore).toBe(false);
  });

  it('shows first two newest and total count when more than two exist', () => {
    const trips = [
      createPreviousTrip('oldest', '2026-01-01'),
      createPreviousTrip('middle', '2026-06-01'),
      createPreviousTrip('newest', '2026-08-01'),
    ];
    const preview = getHomePreviousPreview(trips, 2, ref);

    expect(preview.totalCount).toBe(3);
    expect(preview.hasMore).toBe(true);
    expect(preview.visibleTrips.map((trip) => trip.id)).toEqual(['newest', 'middle']);
    expect(buildViewAllPreviousTripsLabel(3)).toBe('View all previous trips (3)');
  });
});

describe('trips browse filter parsing', () => {
  it('parses known filters and defaults invalid values to All', () => {
    expect(parseTripsBrowseFilter(undefined)).toBe('all');
    expect(parseTripsBrowseFilter('drafts')).toBe('drafts');
    expect(parseTripsBrowseFilter('upcoming')).toBe('upcoming');
    expect(parseTripsBrowseFilter('previous')).toBe('previous');
    expect(parseTripsBrowseFilter('archived')).toBe('all');
  });
});

describe('trips browse navigation', () => {
  it('builds deep links for All, Drafts, and Previous', () => {
    expect(String(buildTripsBrowseHref('all'))).toBe('/trip/browse');
    expect(String(buildTripsBrowseHref('drafts'))).toBe('/trip/browse?filter=drafts');
    expect(String(buildTripsBrowseHref('previous'))).toBe('/trip/browse?filter=previous');
  });

  it('exposes permanent Manage all trips home entry copy', () => {
    expect(MANAGE_ALL_TRIPS_LABEL).toBe('Manage all trips');
    expect(MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL).toBe('Manage all trips');
    expect(String(buildTripsBrowseHref('all'))).toBe('/trip/browse');
  });
});
