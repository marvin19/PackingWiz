import type { PackingItem } from '@/domain/packing-item';
import type { PackingProfile } from '@/domain/packing-profile';
import {
  saveImportantItemNamesForProfile,
} from '@/domain/profile-important-items';
import type { Trip } from '@/domain/trip';
import { createDestinationFromText } from '@/domain/destination';
import { reconcileActivePackingListId } from '@/domain/active-packing-list';
import { normalizeTrip, primaryPackingListId, type TripLike } from '@/domain/trip-compatibility';
import {
  packingListsStateEqual,
  snapshotPackingListsState,
  TripEditError,
} from '@/domain/trip-edit';
import { MockTripRepository } from '@/repositories/trips/mock-trip-repository';
import type { PackingGenerator } from '@/services/packing/packing-generator';
import {
  addTravellerToTrip,
  assertExistingListsUnchanged,
  mapTripById,
  persistEditedTrip,
  reconcileActiveListAfterTravellerRemoval,
  removeTravellerFromTrip,
  updateTripSharedDetails,
} from '@/services/trip-edit-orchestration';

const TRIP_ID = 'trip-orchestration';

const emilieProfile: PackingProfile = {
  id: `${TRIP_ID}-profile-emilie`,
  name: 'Emilie',
  age: 8,
  isSelf: false,
};

const jonasProfile: PackingProfile = {
  id: 'profile-jonas',
  name: 'Jonas',
  age: 10,
  isSelf: false,
};

function makeItem(
  id: string,
  name: string,
  overrides: Partial<PackingItem> = {},
): PackingItem {
  return {
    id,
    name,
    quantity: overrides.quantity ?? 1,
    category: overrides.category ?? 'Clothing',
    packed: overrides.packed ?? false,
    needToBuy: overrides.needToBuy ?? false,
    assignedTo: null,
    source: overrides.source ?? 'generated',
    note: overrides.note,
    importantItemId: overrides.importantItemId,
  };
}

function createMeEmilieTrip(overrides: Partial<TripLike> = {}): Trip {
  const meListId = primaryPackingListId(TRIP_ID);
  const emilieListId = `${TRIP_ID}-list-emilie`;

  const input: TripLike = {
    id: TRIP_ID,
    name: 'Family trip',
    title: 'Family trip',
    destination: createDestinationFromText('Oslo', 'Norway'),
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    tripContext: ['City'],
    accommodation: 'hotel',
    laundry: 'yes',
    note: '',
    weather: {
      mode: 'climate',
      summary: 'Existing weather',
      detail: '',
      high: 22,
      low: 12,
    },
    travelers: [
      { id: 't-you', name: 'You', role: 'Adult' },
      { id: emilieProfile.id, name: 'Emilie', role: 'Child', age: 8 },
    ],
    bags: [],
    insights: [],
    status: 'upcoming',
    packingLists: [
      {
        id: meListId,
        packingProfileId: `${TRIP_ID}-profile-self`,
        profileSnapshot: {
          id: `${TRIP_ID}-profile-self`,
          name: 'Me',
          isSelf: true,
        },
        packingMode: 'generated',
        items: [
          makeItem('me-packed', 'Me packed shirt', { packed: true, quantity: 2 }),
          makeItem('me-important', 'Me passport', {
            category: 'Important',
            source: 'important',
            importantItemId: 'imp-me-passport',
          }),
        ],
      },
      {
        id: emilieListId,
        packingProfileId: emilieProfile.id,
        profileSnapshot: {
          id: emilieProfile.id,
          name: 'Emilie',
          age: 8,
          isSelf: false,
        },
        packingMode: 'manual',
        items: [
          makeItem('emilie-packed', 'Emilie toy', { packed: true }),
          makeItem('emilie-important', 'Emilie teddy', {
            category: 'Important',
            source: 'important',
            importantItemId: 'imp-emilie-teddy',
          }),
        ],
      },
    ],
    items: [],
    packingMode: 'generated',
    generated: true,
    ...overrides,
  };

  return normalizeTrip(input);
}

function createTrackingGenerator() {
  const calls: PackingProfile[] = [];

  const generator: PackingGenerator = {
    generate: jest.fn(async ({ profile }) => {
      calls.push(profile);
      return {
        items: [
          makeItem(`generated-${profile.id}`, `${profile.name} generated item`, {
            category: 'Essentials',
          }),
        ],
        insights: [`Generated insight for ${profile.name}`],
      };
    }),
  };

  return { generator, calls };
}

describe('updateTripSharedDetails orchestration', () => {
  it('A. updates shared fields without mutating existing lists or calling generator', async () => {
    const before = createMeEmilieTrip();
    const beforeLists = snapshotPackingListsState(before);
    const { generator } = createTrackingGenerator();

    const { trip: after, packingRelevantChanges } = updateTripSharedDetails(before, {
      destination: createDestinationFromText('Bergen', 'Norway'),
      tripContext: ['Mountains'],
    });

    expect(after.destination.displayName).toBe('Bergen');
    expect(after.tripContext).toEqual(['Mountains']);
    expect(packingRelevantChanges.destination).toBe(true);
    expect(packingRelevantChanges.tripContext).toBe(true);
    expect(snapshotPackingListsState(after)).toEqual(beforeLists);
    expect(packingListsStateEqual(before, after)).toBe(true);
    expect(generator.generate).not.toHaveBeenCalled();
  });
});

describe('addTravellerToTrip orchestration', () => {
  it('B. adds generated Jonas with one generator call and preserves Me/Emilie lists and Important snapshots', async () => {
    const before = createMeEmilieTrip();
    const beforeLists = snapshotPackingListsState(before);
    const { generator, calls } = createTrackingGenerator();
    const importantByProfileId = saveImportantItemNamesForProfile(
      {},
      'profile-jonas',
      ['Jonas inhaler'],
      () => 'imp-jonas-inhaler',
    ).store;

    const result = await addTravellerToTrip(
      { trip: before, profile: jonasProfile, packingMode: 'generated', importantByProfileId },
      { packingGenerator: generator },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].id).toBe('profile-jonas');
    expect(result.trip.packingLists).toHaveLength(3);
    expect(snapshotPackingListsState(result.trip).slice(0, 2)).toEqual(beforeLists);
    assertExistingListsUnchanged(before, result.trip);

    const jonasList = result.trip.packingLists.find((list) => list.packingProfileId === 'profile-jonas');
    expect(jonasList?.items.some((item) => item.importantItemId === 'imp-jonas-inhaler')).toBe(true);
    expect(
      result.trip.packingLists[0].items.find((item) => item.importantItemId === 'imp-me-passport'),
    ).toBeTruthy();
    expect(
      result.trip.packingLists[1].items.find((item) => item.importantItemId === 'imp-emilie-teddy'),
    ).toBeTruthy();
  });

  it('C. adds manual Jonas without generator calls and preserves existing lists', async () => {
    const before = createMeEmilieTrip();
    const beforeLists = snapshotPackingListsState(before);
    const { generator } = createTrackingGenerator();
    const importantByProfileId = saveImportantItemNamesForProfile(
      {},
      'profile-jonas',
      ['Jonas notebook'],
      () => 'imp-jonas-notebook',
    ).store;

    const result = await addTravellerToTrip(
      { trip: before, profile: jonasProfile, packingMode: 'manual', importantByProfileId },
      { packingGenerator: generator },
    );

    expect(generator.generate).not.toHaveBeenCalled();
    expect(result.trip.packingLists).toHaveLength(3);
    expect(snapshotPackingListsState(result.trip).slice(0, 2)).toEqual(beforeLists);
    expect(
      result.trip.packingLists[2].items.some((item) => item.importantItemId === 'imp-jonas-notebook'),
    ).toBe(true);
  });

  it('D. rejects duplicate profile with zero generator calls', async () => {
    const before = createMeEmilieTrip();
    const { generator } = createTrackingGenerator();

    await expect(
      addTravellerToTrip(
        { trip: before, profile: emilieProfile, packingMode: 'generated' },
        { packingGenerator: generator },
      ),
    ).rejects.toThrow(TripEditError);

    expect(generator.generate).not.toHaveBeenCalled();
  });

  it('merges generated Jonas insights without removing existing insights or duplicating strings', async () => {
    const sharedInsight = 'Shared laundry tip';
    const before = createMeEmilieTrip({
      insights: ['Existing Me insight', sharedInsight],
    });
    const { generator } = createTrackingGenerator();

    (generator.generate as jest.Mock).mockImplementation(async ({ profile }) => ({
      items: [makeItem(`generated-${profile.id}`, `${profile.name} item`)],
      insights: [sharedInsight, 'Generated insight for Jonas'],
    }));

    const result = await addTravellerToTrip(
      { trip: before, profile: jonasProfile, packingMode: 'generated' },
      { packingGenerator: generator },
    );

    expect(result.trip.insights).toEqual([
      'Existing Me insight',
      sharedInsight,
      'Generated insight for Jonas',
    ]);
  });

  it('does not alter insights when Jonas is added manually', async () => {
    const before = createMeEmilieTrip({
      insights: ['Existing Me insight', 'Another tip'],
    });
    const { generator } = createTrackingGenerator();

    const result = await addTravellerToTrip(
      { trip: before, profile: jonasProfile, packingMode: 'manual' },
      { packingGenerator: generator },
    );

    expect(result.trip.insights).toEqual(['Existing Me insight', 'Another tip']);
    expect(generator.generate).not.toHaveBeenCalled();
  });
});

describe('removeTravellerFromTrip orchestration', () => {
  it('E. removes non-active Emilie while Me remains active', () => {
    const before = createMeEmilieTrip();
    const meListId = before.packingLists[0].id;
    const emilieListId = before.packingLists[1].id;
    const meBefore = snapshotPackingListsState(before)[0];

    const after = removeTravellerFromTrip(before, { packingListId: emilieListId });
    const nextActive = reconcileActiveListAfterTravellerRemoval(
      TRIP_ID,
      meListId,
      emilieListId,
      after,
    );

    expect(after.packingLists).toHaveLength(1);
    expect(snapshotPackingListsState(after)[0]).toEqual(meBefore);
    expect(nextActive).toBe(meListId);
  });

  it('F. auto-resolves the only remaining list when the active list is removed', () => {
    const before = createMeEmilieTrip();
    const meListId = before.packingLists[0].id;
    const emilieListId = before.packingLists[1].id;

    const after = removeTravellerFromTrip(before, { packingListId: emilieListId });
    const nextActive = reconcileActiveListAfterTravellerRemoval(
      TRIP_ID,
      emilieListId,
      emilieListId,
      after,
    );

    expect(nextActive).toBe(meListId);
    expect(reconcileActivePackingListId(TRIP_ID, nextActive, [after]).autoResolved).toBe(true);
  });

  it('F. requires explicit selection when active list is removed and multiple lists remain', async () => {
    const before = createMeEmilieTrip();
    const { generator } = createTrackingGenerator();
    const withJonas = (
      await addTravellerToTrip(
        { trip: before, profile: jonasProfile, packingMode: 'manual' },
        { packingGenerator: generator },
      )
    ).trip;

    const emilieListId = withJonas.packingLists[1].id;
    const after = removeTravellerFromTrip(withJonas, { packingListId: emilieListId });
    const nextActive = reconcileActiveListAfterTravellerRemoval(
      TRIP_ID,
      emilieListId,
      emilieListId,
      after,
    );

    expect(after.packingLists).toHaveLength(2);
    expect(nextActive).toBeNull();
    expect(reconcileActivePackingListId(TRIP_ID, nextActive, [after]).selectionRequired).toBe(true);
  });

  it('G. rejects removing the only list before persistence', () => {
    const singleListTrip = normalizeTrip({
      ...createMeEmilieTrip(),
      packingLists: [createMeEmilieTrip().packingLists[0]],
      travelers: [{ id: 't-you', name: 'You', role: 'Adult' }],
    });

    expect(() =>
      removeTravellerFromTrip(singleListTrip, { packingListId: singleListTrip.packingLists[0].id }),
    ).toThrow(/only packing list/);
  });
});

describe('persistEditedTrip rollback contract', () => {
  it('H. leaves trips unchanged when repository save fails', async () => {
    class FailingSaveRepository extends MockTripRepository {
      async save(): Promise<Trip> {
        throw new Error('save failed');
      }
    }

    const repo = new FailingSaveRepository([]);
    const trips = [createMeEmilieTrip()];
    const previousTrips = trips.map((trip) => ({ ...trip }));
    const { trip: updatedTrip } = updateTripSharedDetails(trips[0], {
      name: 'Updated name',
    });

    const optimisticTrips = mapTripById(trips, TRIP_ID, () => updatedTrip);
    expect(optimisticTrips[0].name).toBe('Updated name');

    await expect(persistEditedTrip(repo, updatedTrip)).rejects.toThrow('save failed');

    expect(trips).toEqual(previousTrips);
  });
});
