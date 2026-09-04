import * as persistence from '@/config/persistence';
import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  buildReuseTripInput,
  createReuseFormStateFromTrip,
  getReuseSourceSummary,
  getReuseTravellerRows,
  toggleReuseTravellerSelection,
  validateReuseTripForm,
} from '@/features/trips/utils/reuse-trip-view-model';
import {
  REUSE_SELECT_PERSON_ERROR,
  REUSE_TRIP_ACTION_LABEL,
} from '@/features/trips/utils/reuse-trip-display';
import {
  buildReuseTripHref,
  buildReuseTripSectionHref,
} from '@/features/trips/utils/reuse-trip-navigation';
import { SUPABASE_MULTI_LIST_SAVE_ERROR } from '@/repositories/trips/supabase-trip-save-guard';

const TRIP_ID = 'trip-reuse-ui';

function makeItem(id: string, name: string): PackingItem {
  return {
    id,
    name,
    quantity: 1,
    category: 'Clothing',
    packed: true,
    needToBuy: false,
    assignedTo: null,
    source: 'generated',
  };
}

function createFixtureTrip(): Trip {
  const meListId = primaryPackingListId(TRIP_ID);
  const emilieListId = `${TRIP_ID}-list-emilie`;

  const input: TripLike = {
    id: TRIP_ID,
    name: 'Tokyo & Kyoto',
    title: 'Tokyo & Kyoto',
    destination: createDestinationFromText('Tokyo', 'Japan'),
    startDate: '2025-09-12',
    endDate: '2025-09-18',
    tripContext: ['Business', 'Vacation'],
    accommodation: 'hotel',
    laundry: 'yes',
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    bags: [{ id: 'bag-1', name: 'Carry-on', type: 'carryon', ownerId: null }],
    note: 'Window seat',
    weather: { mode: 'climate', summary: 'Warm', detail: '', high: 24, low: 16 },
    insights: [],
    packingLists: [
      {
        id: meListId,
        packingProfileId: `${TRIP_ID}-profile-self`,
        profileSnapshot: { id: `${TRIP_ID}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [makeItem('item-me', 'Shirt')],
      },
      {
        id: emilieListId,
        packingProfileId: `${TRIP_ID}-profile-emilie`,
        profileSnapshot: { id: `${TRIP_ID}-profile-emilie`, name: 'Emilie', isSelf: false },
        packingMode: 'manual',
        items: [makeItem('item-emilie', 'Toy')],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    status: 'past',
  };

  return normalizeTrip(input);
}

describe('reuse trip view model', () => {
  const referenceDate = new Date('2026-06-15T12:00:00');

  it('prefills shared details and leaves dates empty with all travellers selected', () => {
    const trip = createFixtureTrip();
    const form = createReuseFormStateFromTrip(trip);

    expect(form.startDate).toBe('');
    expect(form.endDate).toBe('');
    expect(form.destination.displayName).toBe('Tokyo');
    expect(form.tripContext).toEqual(['Business', 'Vacation']);
    expect(form.note).toBe('Window seat');
    expect(form.selectedPackingListIds).toEqual([
      primaryPackingListId(TRIP_ID),
      `${TRIP_ID}-list-emilie`,
    ]);
  });

  it('builds source summary without packed progress', () => {
    const trip = createFixtureTrip();
    const summary = getReuseSourceSummary(trip);

    expect(summary.tripName).toBe('Tokyo & Kyoto');
    expect(summary.dateRangeLabel).toContain('Sep');
    expect(summary.peopleLabel).toBe('2 people');
    expect(summary.accessibilityLabel).toContain('Tokyo & Kyoto');
  });

  it('validates dates and traveller selection', () => {
    const trip = createFixtureTrip();
    const form = createReuseFormStateFromTrip(trip);

    expect(validateReuseTripForm(form, referenceDate).canSubmit).toBe(false);
    expect(validateReuseTripForm(form, referenceDate).dateError).toBeNull();

    const withDates = {
      ...form,
      startDate: '2026-06-14',
      endDate: '2026-06-20',
    };
    expect(validateReuseTripForm(withDates, referenceDate).dateError).toMatch(/past/i);

    const valid = {
      ...form,
      startDate: '2026-06-15',
      endDate: '2026-06-20',
    };
    expect(validateReuseTripForm(valid, referenceDate).canSubmit).toBe(true);

    const noneSelected = { ...valid, selectedPackingListIds: [], newTravellers: [] };
    expect(validateReuseTripForm(noneSelected, referenceDate).travellerError).toBe(
      REUSE_SELECT_PERSON_ERROR,
    );

    const onlyNew = {
      ...valid,
      selectedPackingListIds: [],
      newTravellers: [
        {
          id: 'entry-simen',
          profile: { id: 'profile-simen', name: 'Simen', age: 12, isSelf: false },
          packingMode: 'generated' as const,
        },
      ],
    };
    expect(validateReuseTripForm(onlyNew, referenceDate).canSubmit).toBe(true);
  });

  it('maps selected list ids and shared detail edits to ReuseTripInput', () => {
    const trip = createFixtureTrip();
    const meListId = primaryPackingListId(TRIP_ID);
    const form = {
      ...createReuseFormStateFromTrip(trip),
      startDate: '2026-08-01',
      endDate: '2026-08-08',
      selectedPackingListIds: [meListId],
      destination: createDestinationFromText('Lisbon', 'Portugal'),
      tripContext: ['City'],
      note: 'Updated note',
    };

    const input = buildReuseTripInput(form, referenceDate);

    expect(input.packingListIds).toEqual([meListId]);
    expect(input.newTravellers).toEqual([]);
    expect(input.sharedDetails.startDate).toBe('2026-08-01');
    expect(input.sharedDetails.destination?.displayName).toBe('Lisbon');
    expect(input.sharedDetails.tripContext).toEqual(['City']);
    expect(input.sharedDetails.note).toBe('Updated note');
    expect(input.referenceDate).toEqual(referenceDate);
  });

  it('supports traveller toggle rows tied to source list ids', () => {
    const trip = createFixtureTrip();
    const meListId = primaryPackingListId(TRIP_ID);
    const emilieListId = `${TRIP_ID}-list-emilie`;

    const rows = getReuseTravellerRows(trip, [meListId]);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.listId === meListId)?.selected).toBe(true);
    expect(rows.find((row) => row.listId === emilieListId)?.selected).toBe(false);

    const toggled = toggleReuseTravellerSelection([meListId], emilieListId);
    expect(toggled).toEqual([meListId, emilieListId]);
  });

  it('blocks supabase multi-list reuse ahead of submission', () => {
    const spy = jest.spyOn(persistence, 'getPersistenceMode').mockReturnValue('supabase');

    const trip = createFixtureTrip();
    const form = {
      ...createReuseFormStateFromTrip(trip),
      startDate: '2026-08-01',
      endDate: '2026-08-08',
    };

    expect(validateReuseTripForm(form, referenceDate).persistenceError).toBe(
      SUPABASE_MULTI_LIST_SAVE_ERROR,
    );
    expect(validateReuseTripForm(form, referenceDate).canSubmit).toBe(false);

    spy.mockRestore();
  });
});

describe('reuse trip navigation', () => {
  it('builds reuse route hrefs', () => {
    expect(String(buildReuseTripHref('trip-abc'))).toBe('/trip/reuse?tripId=trip-abc');
    expect(String(buildReuseTripSectionHref('trip-abc', 'bags'))).toBe(
      '/trip/reuse-section?tripId=trip-abc&section=bags',
    );
  });

  it('uses Reuse trip action label', () => {
    expect(REUSE_TRIP_ACTION_LABEL).toBe('Reuse trip');
  });
});
