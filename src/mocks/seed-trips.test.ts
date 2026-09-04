import { listPreviousTrips, listUpcomingTrips } from '@/domain/trip-selectors';
import { isUpcomingTrip } from '@/domain/trip-lifecycle';
import { packingStats } from '@/domain/packing-stats';
import {
  MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL,
  MANAGE_ALL_TRIPS_LABEL,
} from '@/features/trips/components/home-view-all-link';
import { buildReuseTripHref } from '@/features/trips/utils/reuse-trip-navigation';
import { buildTripsBrowseHref } from '@/features/trips/utils/trips-browse-navigation';
import {
  LISBON_EMILIE_LIST_ID,
  LISBON_REUSE_FIXTURE_ID,
  mockLisbonTrip,
  mockSeedTrips,
  mockTokyoTrip,
} from '@/mocks/seed-trips';

describe('seed trips fixtures', () => {
  const referenceDate = new Date('2026-09-04T12:00:00');

  it('classifies Lisbon as Previous and Tokyo as Upcoming for reuse manual testing', () => {
    const previous = listPreviousTrips(mockSeedTrips, referenceDate);
    const upcoming = listUpcomingTrips(mockSeedTrips, referenceDate);

    expect(previous.some((trip) => trip.id === LISBON_REUSE_FIXTURE_ID)).toBe(true);
    expect(upcoming.some((trip) => trip.id === mockTokyoTrip.id)).toBe(true);
  });

  it('provides a multi-person Previous fixture with representative packing metadata', () => {
    expect(mockLisbonTrip.packingLists.length).toBeGreaterThanOrEqual(2);

    const meList = mockLisbonTrip.packingLists.find((list) => list.profileSnapshot.isSelf);
    const emilieList = mockLisbonTrip.packingLists.find((list) => list.id === LISBON_EMILIE_LIST_ID);

    expect(meList?.packingMode).toBe('generated');
    expect(emilieList?.packingMode).toBe('manual');
    expect(emilieList?.profileSnapshot.name).toBe('Emilie');

    const meItems = meList?.items ?? [];
    expect(meItems.some((item) => item.packed)).toBe(true);
    expect(meItems.some((item) => !item.packed)).toBe(true);
    expect(meItems.some((item) => (item.quantity ?? 1) > 1)).toBe(true);
    expect(meItems.some((item) => item.needToBuy)).toBe(true);
    expect(meItems.some((item) => item.note?.length)).toBe(true);
    expect(meItems.some((item) => item.source === 'important' && item.importantItemId === 'imp-passport')).toBe(
      true,
    );

    expect(packingStats(mockLisbonTrip).packed).toBeGreaterThan(0);
  });

  it('provides an Upcoming multi-person fixture for browse reuse entry testing', () => {
    expect(mockTokyoTrip.packingLists.length).toBeGreaterThanOrEqual(2);
    expect(isUpcomingTrip(mockTokyoTrip, referenceDate)).toBe(true);
  });
});

describe('trips browse management navigation', () => {
  it('exposes Manage all trips home entry to the All filter', () => {
    expect(MANAGE_ALL_TRIPS_LABEL).toBe('Manage all trips');
    expect(MANAGE_ALL_TRIPS_ACCESSIBILITY_LABEL).toBe('Manage all trips');
    expect(String(buildTripsBrowseHref('all'))).toBe('/trip/browse');
  });

  it('routes reuse from committed trips using exact source trip id', () => {
    expect(String(buildReuseTripHref(LISBON_REUSE_FIXTURE_ID))).toBe(
      `/trip/reuse?tripId=${LISBON_REUSE_FIXTURE_ID}`,
    );
    expect(String(buildReuseTripHref(mockTokyoTrip.id))).toBe(
      `/trip/reuse?tripId=${mockTokyoTrip.id}`,
    );
  });
});
