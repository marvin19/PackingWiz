import type { PackingItem } from '@/domain/packing-item';
import type { PackingProfile } from '@/domain/packing-profile';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { normalizeTrip, primaryPackingProfileId, type TripLike } from '@/domain/trip-compatibility';
import {
  appendTravellerPackingListToTrip,
  applyTripSharedDetailsEdit,
  buildEmptyTravellerPackingListForTrip,
  detectTripPackingRelevantChanges,
  hasTripPackingRelevantChanges,
  packingListsStateEqual,
  removeTravellerPackingListFromTrip,
  snapshotPackingListsState,
  TripEditError,
  tripHasPackingProfile,
  type TripSharedDetailsUserEdit,
} from '@/domain/trip-edit';
import { createMultiListFixtureTrip, multiListFixtureSecondaryListId } from '@/mocks/multi-list-fixture';
import { createSeedPrimaryPackingList } from '@/mocks/seed-packing-lists';

const SINGLE_TRIP_ID = 'trip-edit-single';

function baseTripFields(tripId: string) {
  return {
    id: tripId,
    name: 'Summer trip',
    title: 'Summer trip',
    destination: createDestinationFromText('Barcelona', 'Spain'),
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    tripContext: ['Beach', 'City'],
    accommodation: 'hotel' as const,
    laundry: 'yes' as const,
    note: 'Window seat please',
    weather: {
      mode: 'climate' as const,
      summary: 'Warm and sunny',
      detail: '',
      high: 30,
      low: 20,
    },
    bags: [{ id: 'bag-carry-on', name: 'Carry-on', type: 'carryon' as const, ownerId: null }],
    insights: [],
    status: 'upcoming' as const,
  };
}

function richPrimaryItems(): PackingItem[] {
  return [
    {
      id: 'item-packed',
      name: 'Packed shirt',
      quantity: 2,
      category: 'Clothing',
      packed: true,
      needToBuy: false,
      assignedTo: null,
      source: 'generated',
      note: 'Bring blue one',
    },
    {
      id: 'item-need-buy',
      name: 'Sunscreen',
      quantity: 1,
      category: 'Toiletries',
      packed: false,
      needToBuy: true,
      assignedTo: null,
      source: 'generated',
    },
    {
      id: 'item-important',
      name: 'Passport',
      quantity: 1,
      category: 'Important',
      packed: false,
      needToBuy: false,
      assignedTo: null,
      source: 'important',
      importantItemId: 'imp-passport',
    },
    {
      id: 'item-manual',
      name: 'Custom adapter',
      quantity: 1,
      category: 'Electronics',
      packed: false,
      needToBuy: false,
      assignedTo: null,
      source: 'generated',
      note: 'EU plug',
    },
  ];
}

function createSingleListTrip(): Trip {
  const primaryList = createSeedPrimaryPackingList(
    SINGLE_TRIP_ID,
    richPrimaryItems(),
    'generated',
  );

  const input: TripLike = {
    ...baseTripFields(SINGLE_TRIP_ID),
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    packingLists: [primaryList],
    items: primaryList.items,
    packingMode: primaryList.packingMode,
    generated: true,
  };

  return normalizeTrip(input);
}

function createMeOnlyTrip(tripId = 'trip-add-traveller'): Trip {
  const primaryList = createSeedPrimaryPackingList(tripId, richPrimaryItems(), 'generated');

  return normalizeTrip({
    ...baseTripFields(tripId),
    travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    packingLists: [primaryList],
    items: primaryList.items,
    packingMode: primaryList.packingMode,
    generated: true,
  });
}

const emilieProfile: PackingProfile = {
  id: 'profile-emilie',
  name: 'Emilie',
  age: 8,
  isSelf: false,
};

describe('applyTripSharedDetailsEdit', () => {
  it('A. preserves PackingList ids and item state when shared context changes', () => {
    const before = createSingleListTrip();
    const beforeSnapshot = snapshotPackingListsState(before);

    const after = applyTripSharedDetailsEdit(before, {
      destination: createDestinationFromText('Lisbon', 'Portugal'),
      startDate: '2026-08-01',
      endDate: '2026-08-12',
      tripContext: ['City', 'Food'],
      accommodation: 'apartment',
      laundry: 'unsure',
      note: 'Updated note',
      name: 'Portugal adventure',
    });

    expect(after.destination.displayName).toBe('Lisbon');
    expect(after.startDate).toBe('2026-08-01');
    expect(after.endDate).toBe('2026-08-12');
    expect(after.tripContext).toEqual(['City', 'Food']);
    expect(after.accommodation).toBe('apartment');
    expect(after.laundry).toBe('unsure');
    expect(after.note).toBe('Updated note');
    expect(after.name).toBe('Portugal adventure');

    expect(snapshotPackingListsState(after)).toEqual(beforeSnapshot);
    expect(packingListsStateEqual(before, after)).toBe(true);
    expect(after.packingLists[0].items.find((item) => item.id === 'item-packed')?.packed).toBe(true);
    expect(after.packingLists[0].items.find((item) => item.id === 'item-packed')?.quantity).toBe(2);
    expect(after.packingLists[0].items.find((item) => item.id === 'item-need-buy')?.needToBuy).toBe(true);
    expect(after.packingLists[0].items.find((item) => item.id === 'item-important')?.importantItemId).toBe(
      'imp-passport',
    );
    expect(after.packingLists[0].items.find((item) => item.id === 'item-manual')?.note).toBe('EU plug');
  });

  it('does not regenerate lists when only bags change', () => {
    const before = createSingleListTrip();

    const after = applyTripSharedDetailsEdit(before, {
      bags: [{ id: 'bag-checked', name: 'Checked bag', type: 'checked', ownerId: null }],
    });

    expect(packingListsStateEqual(before, after)).toBe(true);
    expect(after.bags).toHaveLength(1);
    expect(after.bags[0].id).toBe('bag-checked');
  });
});

describe('multi-person shared context edit isolation', () => {
  it('B. preserves both lists and item state when shared context changes', () => {
    const before = createMultiListFixtureTrip();
    const beforeSnapshot = snapshotPackingListsState(before);

    const after = applyTripSharedDetailsEdit(before, {
      destination: createDestinationFromText('Rome', 'Italy'),
      tripContext: ['Culture'],
    });

    expect(after.destination.displayName).toBe('Rome');
    expect(snapshotPackingListsState(after)).toEqual(beforeSnapshot);
    expect(after.packingLists).toHaveLength(2);
    expect(after.packingLists[1].items[0].packed).toBe(true);
  });
});

describe('appendTravellerPackingListToTrip', () => {
  it('C. adds exactly one new list while Me list stays unchanged', () => {
    const before = createMeOnlyTrip();
    const meListBefore = snapshotPackingListsState(before)[0];

    const emilieList = buildEmptyTravellerPackingListForTrip(before, emilieProfile, 'manual');
    const after = appendTravellerPackingListToTrip(before, emilieList);

    expect(after.packingLists).toHaveLength(2);
    expect(snapshotPackingListsState(after)[0]).toEqual(meListBefore);
    expect(tripHasPackingProfile(after, emilieProfile)).toBe(true);
    expect(after.packingLists[1].packingProfileId).toBe(emilieProfile.id);
    expect(after.packingLists[1].packingMode).toBe('manual');
    expect(after.travelers.some((traveler) => traveler.id === emilieProfile.id)).toBe(true);
  });

  it('rejects duplicate profile ownership', () => {
    const trip = createMeOnlyTrip();
    const emilieList = buildEmptyTravellerPackingListForTrip(trip, emilieProfile);
    const withEmilie = appendTravellerPackingListToTrip(trip, emilieList);

    expect(() => buildEmptyTravellerPackingListForTrip(withEmilie, emilieProfile)).toThrow(TripEditError);
    expect(() => buildEmptyTravellerPackingListForTrip(withEmilie, emilieProfile)).toThrow(
      /Profile already has a packing list/,
    );

    const duplicateList = {
      ...emilieList,
      id: `${trip.id}-list-emilie-duplicate`,
    };

    expect(() => appendTravellerPackingListToTrip(withEmilie, duplicateList)).toThrow(TripEditError);
    expect(() => appendTravellerPackingListToTrip(withEmilie, duplicateList)).toThrow(/Profile already has/);
  });
});

describe('removeTravellerPackingListFromTrip', () => {
  it('D. removes Emilie list and preserves Me list without touching reusable profile data', () => {
    const before = createMultiListFixtureTrip();
    const meListBefore = snapshotPackingListsState(before)[0];
    const emilieProfileId = `${before.id}-profile-emilie`;

    const after = removeTravellerPackingListFromTrip(before, {
      packingProfileId: emilieProfileId,
    });

    expect(after.packingLists).toHaveLength(1);
    expect(snapshotPackingListsState(after)[0]).toEqual(meListBefore);
    expect(after.packingLists.some((list) => list.id === multiListFixtureSecondaryListId)).toBe(false);
    expect(after.travelers.some((traveler) => traveler.name === 'Emilie')).toBe(false);

    // Reusable profile Important master lives outside Trip — trip edit does not model it.
    expect(emilieProfileId).toBe(`${before.id}-profile-emilie`);
  });

  it('E. rejects missing packing list id without deleting another list', () => {
    const before = createMultiListFixtureTrip();
    const meListBefore = snapshotPackingListsState(before)[0];

    expect(() =>
      removeTravellerPackingListFromTrip(before, { packingListId: 'missing-list-id' }),
    ).toThrow(TripEditError);

    expect(() =>
      removeTravellerPackingListFromTrip(before, { packingListId: 'missing-list-id' }),
    ).toThrow(/not found/);

    expect(snapshotPackingListsState(before)[0]).toEqual(meListBefore);
    expect(before.packingLists).toHaveLength(2);
  });

  it('F. rejects removing the only PackingList on a trip', () => {
    const trip = createSingleListTrip();
    const primaryListId = trip.packingLists[0].id;
    const selfProfileId = primaryPackingProfileId(trip.id);

    expect(() => removeTravellerPackingListFromTrip(trip, { packingListId: primaryListId })).toThrow(
      TripEditError,
    );
    expect(() => removeTravellerPackingListFromTrip(trip, { packingListId: primaryListId })).toThrow(
      /only packing list/,
    );

    expect(() => removeTravellerPackingListFromTrip(trip, { packingProfileId: selfProfileId })).toThrow(
      /only packing list/,
    );
  });
});

describe('detectTripPackingRelevantChanges', () => {
  it('G. reports packing-relevant edits and ignores equivalent no-op edits', () => {
    const before = createSingleListTrip();

    const edited = applyTripSharedDetailsEdit(before, {
      destination: createDestinationFromText('Madrid', 'Spain'),
      startDate: '2026-09-01',
      tripContext: ['Museums'],
      accommodation: 'hostel',
      laundry: 'no',
    });

    const relevantChanges = detectTripPackingRelevantChanges(before, edited);

    expect(relevantChanges.destination).toBe(true);
    expect(relevantChanges.startDate).toBe(true);
    expect(relevantChanges.tripContext).toBe(true);
    expect(relevantChanges.accommodation).toBe(true);
    expect(relevantChanges.laundry).toBe(true);
    expect(hasTripPackingRelevantChanges(relevantChanges)).toBe(true);

    const nameOnly = applyTripSharedDetailsEdit(before, { name: 'Renamed trip' });
    const noPackingChanges = detectTripPackingRelevantChanges(before, nameOnly);

    expect(hasTripPackingRelevantChanges(noPackingChanges)).toBe(false);
  });
});

describe('legacy travelers[] mirror on add/remove', () => {
  it('append preserves existing traveler metadata and appends only the new profile row', () => {
    const trip = normalizeTrip({
      ...baseTripFields('trip-traveler-mirror-add'),
      travelers: [
        {
          id: 't-you',
          name: 'You',
          role: 'Adult',
          birthDate: '1990-01-15',
        },
      ],
      packingLists: [
        createSeedPrimaryPackingList('trip-traveler-mirror-add', richPrimaryItems(), 'generated'),
      ],
      items: richPrimaryItems(),
      packingMode: 'generated',
      generated: true,
    });

    const meBefore = trip.travelers[0];
    const emilieList = buildEmptyTravellerPackingListForTrip(trip, emilieProfile, 'manual');
    const after = appendTravellerPackingListToTrip(trip, emilieList);

    expect(after.travelers).toHaveLength(2);
    expect(after.travelers[0]).toEqual(meBefore);
    expect(after.travelers[1]).toEqual({
      id: emilieProfile.id,
      name: 'Emilie',
      role: 'Child',
      age: 8,
    });
  });

  it('remove drops only the matched legacy traveler row and preserves unrelated metadata', () => {
    const tripId = 'trip-traveler-mirror-remove';
    const emilieListId = `${tripId}-list-emilie`;
    const emilieOnTripProfileId = `${tripId}-profile-emilie`;

    const trip = normalizeTrip({
      ...baseTripFields(tripId),
      travelers: [
        {
          id: 't-you',
          name: 'You',
          role: 'Adult',
          birthDate: '1988-06-02',
        },
        {
          id: emilieOnTripProfileId,
          name: 'Emilie',
          role: 'Child',
          age: 8,
        },
      ],
      packingLists: [
        createSeedPrimaryPackingList(tripId, richPrimaryItems(), 'generated'),
        {
          id: emilieListId,
          packingProfileId: emilieOnTripProfileId,
          profileSnapshot: {
            id: emilieOnTripProfileId,
            name: 'Emilie',
            age: 8,
            isSelf: false,
          },
          packingMode: 'manual',
          items: [],
        },
      ],
      items: richPrimaryItems(),
      packingMode: 'generated',
      generated: true,
    });

    const meBefore = trip.travelers[0];
    const after = removeTravellerPackingListFromTrip(trip, { packingProfileId: emilieOnTripProfileId });

    expect(after.travelers).toHaveLength(1);
    expect(after.travelers[0]).toEqual(meBefore);
    expect(after.travelers.some((traveler) => traveler.name === 'Emilie')).toBe(false);
  });

  it('remove leaves legacy travelers unchanged when no mirror row exists for the removed list', () => {
    const before = createMultiListFixtureTrip();
    const travelersBefore = before.travelers.map((traveler) => ({ ...traveler }));

    const after = removeTravellerPackingListFromTrip(before, {
      packingProfileId: `${before.id}-profile-emilie`,
    });

    expect(after.travelers).toEqual(travelersBefore);
    expect(after.packingLists).toHaveLength(1);
  });
});

describe('TripSharedDetailsUserEdit vs TripSharedDetailsPatch', () => {
  it('user edit fields do not include system-managed weather/status/image', () => {
    const userPatch = {
      name: 'Renamed',
      destination: createDestinationFromText('Oslo', 'Norway'),
    } satisfies TripSharedDetailsUserEdit;

    const after = applyTripSharedDetailsEdit(createSingleListTrip(), userPatch);

    expect(after.name).toBe('Renamed');
    expect(after.weather.summary).toBe('Warm and sunny');
    expect(after.status).toBe('upcoming');
  });
});

describe('MP5A non-regeneration guarantee', () => {
  it('shared context edit never replaces packingLists reference contents', () => {
    const before = createSingleListTrip();
    const listIdsBefore = before.packingLists.map((list) => list.id);
    const itemIdsBefore = before.packingLists[0].items.map((item) => item.id);

    const after = applyTripSharedDetailsEdit(before, {
      destination: createDestinationFromText('Athens', 'Greece'),
      endDate: '2026-12-31',
    });

    expect(after.packingLists.map((list) => list.id)).toEqual(listIdsBefore);
    expect(after.packingLists[0].items.map((item) => item.id)).toEqual(itemIdsBefore);
    expect(packingListsStateEqual(before, after)).toBe(true);
  });
});
