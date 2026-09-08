import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import type { PackingItem } from '@/domain/packing-item';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip } from '@/mocks/seed-trips';
import { TripsProvider, useTrips, type TripsContextValue } from '@/providers/trips-provider';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';

const TRIP_ID = 'trip-provider-vh2b';
const ME_LIST_ID = `${TRIP_ID}-list-me`;
const EMILIE_LIST_ID = `${TRIP_ID}-list-emilie`;
const JONAS_LIST_ID = `${TRIP_ID}-list-jonas`;
const OTHER_TRIP_ID = 'trip-provider-other';

let tripsContext: TripsContextValue | null = null;

function currentTripsContext(): TripsContextValue | null {
  return tripsContext;
}

/** List-scoped snapshot — fails if items move between lists or order/identity changes. */
function tripListsSnapshot(trip: Trip | null | undefined) {
  return (trip?.packingLists ?? []).map((list) => ({
    id: list.id,
    packingMode: list.packingMode,
    packingProfileId: list.packingProfileId,
    profileName: list.profileSnapshot.name,
    items: list.items.map((item) => ({
      id: item.id,
      name: item.name,
      packed: item.packed,
      quantity: item.quantity,
      needToBuy: item.needToBuy,
      note: item.note,
    })),
  }));
}

function createMultiListFixture(): Trip {
  const lisbon = cloneTrip(mockLisbonTrip);
  return normalizeTrip({
    ...lisbon,
    id: TRIP_ID,
    name: 'Provider test trip',
    title: 'Provider test trip',
    packingLists: [
      {
        id: ME_LIST_ID,
        packingProfileId: `${TRIP_ID}-profile-self`,
        profileSnapshot: { id: `${TRIP_ID}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'generated',
        items: [
          {
            id: 'item-me',
            name: 'Me shirt',
            quantity: 1,
            category: 'Clothing',
            packed: false,
            needToBuy: false,
            assignedTo: null,
            note: 'Me-only note',
          },
        ],
      },
      {
        id: EMILIE_LIST_ID,
        packingProfileId: 'profile-emilie',
        profileSnapshot: { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
        packingMode: 'manual',
        items: [
          {
            id: 'item-emilie',
            name: 'Emilie toy',
            quantity: 2,
            category: 'Essentials',
            packed: false,
            needToBuy: true,
            assignedTo: null,
            note: 'Emilie-only note',
          },
        ],
      },
    ],
  } as TripLike);
}

function createThreeListFixture(): Trip {
  const base = createMultiListFixture();
  return {
    ...base,
    packingLists: [
      ...base.packingLists,
      {
        id: JONAS_LIST_ID,
        packingProfileId: 'profile-jonas',
        profileSnapshot: { id: 'profile-jonas', name: 'Jonas', age: 10, isSelf: false },
        packingMode: 'generated',
        items: [
          {
            id: 'item-jonas',
            name: 'Jonas book',
            quantity: 1,
            category: 'Essentials',
            packed: true,
            needToBuy: false,
            assignedTo: null,
          },
        ],
      },
    ],
  };
}

function createOtherTrip(): Trip {
  const lisbon = cloneTrip(mockLisbonTrip);
  return normalizeTrip({
    ...lisbon,
    id: OTHER_TRIP_ID,
    name: 'Other trip',
    title: 'Other trip',
    note: 'Other note',
    insights: ['Keep this insight'],
    packingLists: [
      {
        id: `${OTHER_TRIP_ID}-list-other`,
        packingProfileId: `${OTHER_TRIP_ID}-profile-self`,
        profileSnapshot: { id: `${OTHER_TRIP_ID}-profile-self`, name: 'Me', isSelf: true },
        packingMode: 'manual',
        items: [
          {
            id: 'other-item',
            name: 'Other item',
            quantity: 1,
            category: 'Clothing',
            packed: false,
            needToBuy: false,
            assignedTo: null,
          },
        ],
      },
    ],
  } as TripLike);
}

function createTripRepositoryMock(initialTrips: Trip[]): TripRepository & {
  getAll: jest.Mock;
  getById: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
  updatePackingItem: jest.Mock;
  addPackingItem: jest.Mock;
  deletePackingItem: jest.Mock;
  createTrip: jest.Mock;
  updateTripPackingItems: jest.Mock;
} {
  let trips = initialTrips.map((trip) => cloneTrip(trip));

  return {
    getAll: jest.fn(async () => trips.map((trip) => cloneTrip(trip))),
    getById: jest.fn(async (id: string) => {
      const trip = trips.find((entry) => entry.id === id);
      return trip ? cloneTrip(trip) : null;
    }),
    save: jest.fn(async (trip: Trip) => {
      const exists = trips.some((entry) => entry.id === trip.id);
      if (exists) {
        trips = trips.map((entry) => (entry.id === trip.id ? cloneTrip(trip) : entry));
      } else {
        trips = [cloneTrip(trip), ...trips];
      }
      return cloneTrip(trip);
    }),
    createTrip: jest.fn(async (trip: Trip) => {
      trips = [cloneTrip(trip), ...trips.filter((entry) => entry.id !== trip.id)];
      return cloneTrip(trip);
    }),
    delete: jest.fn(async (id: string) => {
      trips = trips.filter((entry) => entry.id !== id);
    }),
    updateTripPackingItems: jest.fn(async (tripId: string, items: PackingItem[], packingListId?: string) => {
      const trip = trips.find((entry) => entry.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }
      const listId = packingListId ?? trip.packingLists[0]?.id;
      const nextLists = trip.packingLists.map((list) =>
        list.id === listId ? { ...list, items: items.map((item) => ({ ...item })) } : list,
      );
      const updated = { ...trip, packingLists: nextLists };
      trips = trips.map((entry) => (entry.id === tripId ? updated : entry));
      return cloneTrip(updated);
    }),
    updatePackingItem: jest.fn(async (tripId, itemId, patch, packingListId) => {
      const trip = trips.find((entry) => entry.id === tripId);
      if (!trip || !packingListId) {
        throw new Error('Trip or list not found');
      }
      const list = trip.packingLists.find((entry) => entry.id === packingListId);
      const item = list?.items.find((entry) => entry.id === itemId);
      if (!item) {
        throw new Error('Packing item not found');
      }
      return { ...item, ...patch };
    }),
    addPackingItem: jest.fn(async (tripId, input, packingListId) => ({
      id: input.id ?? 'saved-item-id',
      name: input.name,
      category: input.category,
      quantity: input.quantity ?? 1,
      packed: input.packed ?? false,
      needToBuy: input.needToBuy ?? false,
      assignedTo: input.assignedTo ?? null,
      note: input.note,
    })),
    deletePackingItem: jest.fn(async () => undefined),
  };
}

const mockTripRepository = createTripRepositoryMock([]);

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthReady: true,
    authError: null,
    userId: 'user-test',
  }),
}));

jest.mock('@/providers/profile-provider', () => ({
  useProfile: () => ({
    importantByProfileId: {},
    rememberPackingProfile: jest.fn(),
    purgeImportantProfileIds: jest.fn(),
    savedPackingProfiles: [],
  }),
}));

jest.mock('@/providers/services-provider', () => ({
  useServices: () => ({
    tripRepository: mockTripRepository,
    profileRepository: {
      loadAll: jest.fn(),
      saveProfile: jest.fn(),
      saveImportantMaster: jest.fn(),
      deleteProfile: jest.fn(),
    },
    packingGenerator: mockPackingGenerator,
    weatherService: mockWeatherService,
  }),
}));

function TripsProbe() {
  const context = useTrips();
  useEffect(() => {
    tripsContext = context;
  }, [context]);
  return null;
}

async function runProviderMutation(invoke: () => void): Promise<void> {
  await act(async () => {
    invoke();
    await Promise.resolve();
  });
}

async function mountTripsProvider(initialTrips: Trip[]): Promise<void> {
  Object.assign(mockTripRepository, createTripRepositoryMock(initialTrips));
  tripsContext = null;

  await act(async () => {
    TestRenderer.create(
      <TripsProvider>
        <TripsProbe />
      </TripsProvider>,
    );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await Promise.resolve();
      const context = currentTripsContext();
      if (context && !context.isLoading) {
        break;
      }
    }
  });

  const loadedContext = currentTripsContext();
  if (!loadedContext || loadedContext.isLoading) {
    throw new Error('TripsProvider failed to finish loading in test harness');
  }
}

function getTrip(tripId: string = TRIP_ID): Trip {
  const trip = tripsContext!.trips.find((entry) => entry.id === tripId);
  if (!trip) {
    throw new Error(`Trip not found in provider state: ${tripId}`);
  }
  return trip;
}

async function activateEmilieList(): Promise<void> {
  await runProviderMutation(() => {
    tripsContext!.beginTripPackEntry(TRIP_ID, EMILIE_LIST_ID);
  });
  expect(tripsContext!.activeTripId).toBe(TRIP_ID);
  expect(tripsContext!.activePackingListId).toBe(EMILIE_LIST_ID);
}

describe('TripsProvider optimistic mutations (VH2-B)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('togglePacked', () => {
    beforeEach(async () => {
      await mountTripsProvider([createMultiListFixture(), createOtherTrip()]);
      await activateEmilieList();
    });

    it('mutates only the active Emilie item on success', async () => {
      const before = tripListsSnapshot(getTrip());

      mockTripRepository.updatePackingItem.mockResolvedValueOnce({
        id: 'item-emilie',
        name: 'Emilie toy',
        quantity: 2,
        category: 'Essentials',
        packed: true,
        needToBuy: true,
        assignedTo: null,
      });

      await runProviderMutation(() => {
        tripsContext!.togglePacked('item-emilie');
      });

      const after = tripListsSnapshot(getTrip());
      expect(after[0]).toEqual(before[0]);
      expect(after[1]!.items[0]?.packed).toBe(true);
      expect(after[1]!.items[0]?.id).toBe('item-emilie');
      expect(mockTripRepository.updatePackingItem).toHaveBeenCalledWith(
        TRIP_ID,
        'item-emilie',
        { packed: true },
        EMILIE_LIST_ID,
      );
      expect(tripsContext!.activePackingListId).toBe(EMILIE_LIST_ID);
    });

    it('rolls back Emilie toggle when repository fails', async () => {
      const before = tripListsSnapshot(getTrip());
      const beforeActiveTripId = tripsContext!.activeTripId;
      const beforeActiveListId = tripsContext!.activePackingListId;

      mockTripRepository.updatePackingItem.mockRejectedValueOnce(new Error('update failed'));

      await runProviderMutation(() => {
        tripsContext!.togglePacked('item-emilie');
      });

      expect(tripListsSnapshot(getTrip())).toEqual(before);
      expect(tripsContext!.activeTripId).toBe(beforeActiveTripId);
      expect(tripsContext!.activePackingListId).toBe(beforeActiveListId);
      expect(mockTripRepository.updatePackingItem).toHaveBeenCalledWith(
        TRIP_ID,
        'item-emilie',
        expect.any(Object),
        EMILIE_LIST_ID,
      );
    });
  });

  describe('addPackingItem', () => {
    beforeEach(async () => {
      await mountTripsProvider([createMultiListFixture()]);
      await activateEmilieList();
    });

    it('adds to Emilie list only on success', async () => {
      const beforeMeItems = getTrip().packingLists[0]!.items.length;

      mockTripRepository.addPackingItem.mockImplementationOnce(async (_tripId, input, listId) => ({
        id: input.id ?? 'saved-new',
        name: input.name,
        category: input.category,
        quantity: input.quantity ?? 1,
        packed: false,
        needToBuy: false,
        assignedTo: null,
      }));

      await runProviderMutation(() => {
        tripsContext!.addPackingItem({ name: 'Sun hat', category: 'Clothing' });
      });

      const emilieItems = getTrip().packingLists.find((list) => list.id === EMILIE_LIST_ID)!.items;
      expect(emilieItems.some((item) => item.name === 'Sun hat')).toBe(true);
      expect(getTrip().packingLists[0]!.items).toHaveLength(beforeMeItems);
      expect(mockTripRepository.addPackingItem).toHaveBeenCalledWith(
        TRIP_ID,
        expect.objectContaining({ name: 'Sun hat' }),
        EMILIE_LIST_ID,
      );
    });

    it('rolls back phantom item when repository fails', async () => {
      const before = tripListsSnapshot(getTrip());

      mockTripRepository.addPackingItem.mockRejectedValueOnce(new Error('insert failed'));

      await runProviderMutation(() => {
        tripsContext!.addPackingItem({ name: 'Phantom hat', category: 'Clothing' });
      });

      expect(tripListsSnapshot(getTrip())).toEqual(before);
      expect(tripsContext!.activePackingListId).toBe(EMILIE_LIST_ID);
    });
  });

  describe('updatePackingItemSettings', () => {
    beforeEach(async () => {
      await mountTripsProvider([createMultiListFixture()]);
      await activateEmilieList();
    });

    it('updates only the active-list item on success', async () => {
      mockTripRepository.updatePackingItem.mockResolvedValueOnce({
        id: 'item-emilie',
        name: 'Emilie toy',
        quantity: 4,
        category: 'Essentials',
        packed: false,
        needToBuy: false,
        assignedTo: null,
        note: 'Updated note',
      });

      await runProviderMutation(() => {
        tripsContext!.updatePackingItemSettings('item-emilie', {
          name: 'Emilie toy',
          quantity: 4,
          needToBuy: false,
          assignedTo: null,
          note: 'Updated note',
        });
      });

      const emilieItem = getTrip().packingLists.find((list) => list.id === EMILIE_LIST_ID)!
        .items[0]!;
      expect(emilieItem.quantity).toBe(4);
      expect(emilieItem.note).toBe('Updated note');
      expect(emilieItem.needToBuy).toBe(false);
      expect(getTrip().packingLists[0]!.items[0]?.quantity).toBe(1);
      expect(mockTripRepository.updatePackingItem).toHaveBeenCalledWith(
        TRIP_ID,
        'item-emilie',
        expect.objectContaining({ quantity: 4, note: 'Updated note', needToBuy: false }),
        EMILIE_LIST_ID,
      );
    });

    it('restores exact original item when repository fails', async () => {
      const before = tripListsSnapshot(getTrip());

      mockTripRepository.updatePackingItem.mockRejectedValueOnce(new Error('settings failed'));

      await runProviderMutation(() => {
        tripsContext!.updatePackingItemSettings('item-emilie', {
          name: 'Emilie toy',
          quantity: 9,
          needToBuy: false,
          assignedTo: null,
          note: 'Broken note',
        });
      });

      expect(tripListsSnapshot(getTrip())).toEqual(before);
    });
  });

  describe('deletePackingItem', () => {
    beforeEach(async () => {
      await mountTripsProvider([createMultiListFixture()]);
      await activateEmilieList();
    });

    it('removes only the active-list item on success', async () => {
      mockTripRepository.deletePackingItem.mockResolvedValueOnce(undefined);

      await runProviderMutation(() => {
        tripsContext!.deletePackingItem('item-emilie');
      });

      const emilieList = getTrip().packingLists.find((list) => list.id === EMILIE_LIST_ID)!;
      expect(emilieList.items).toHaveLength(0);
      expect(getTrip().packingLists[0]!.items[0]?.id).toBe('item-me');
      expect(mockTripRepository.deletePackingItem).toHaveBeenCalledWith(
        TRIP_ID,
        'item-emilie',
        EMILIE_LIST_ID,
      );
    });

    it('restores deleted item with original order when repository fails', async () => {
      const before = tripListsSnapshot(getTrip());

      mockTripRepository.deletePackingItem.mockRejectedValueOnce(new Error('delete failed'));

      await runProviderMutation(() => {
        tripsContext!.deletePackingItem('item-emilie');
      });

      expect(tripListsSnapshot(getTrip())).toEqual(before);
      expect(getTrip().packingLists.find((list) => list.id === EMILIE_LIST_ID)!.items[0]?.id).toBe(
        'item-emilie',
      );
    });
  });

  describe('addTravellerToTrip', () => {
    it('rolls back new list when repository save fails', async () => {
      await mountTripsProvider([createMultiListFixture()]);
      const before = tripListsSnapshot(getTrip());
      const beforeActiveTripId = tripsContext!.activeTripId;
      const beforeActiveListId = tripsContext!.activePackingListId;

      mockTripRepository.save.mockRejectedValueOnce(new Error('save failed'));

      await act(async () => {
        await expect(
          tripsContext!.addTravellerToTrip(TRIP_ID, {
            id: 'profile-jonas',
            name: 'Jonas',
            age: 10,
            isSelf: false,
          }, 'manual'),
        ).rejects.toThrow('save failed');
      });

      expect(tripListsSnapshot(getTrip())).toEqual(before);
      expect(tripsContext!.activeTripId).toBe(beforeActiveTripId);
      expect(tripsContext!.activePackingListId).toBe(beforeActiveListId);
    });
  });

  describe('removeTravellerFromTrip', () => {
    it('removes Emilie list on success and reconciles active list when it was active', async () => {
      await mountTripsProvider([createThreeListFixture()]);
      await runProviderMutation(() => {
        tripsContext!.beginTripPackEntry(TRIP_ID, EMILIE_LIST_ID);
      });

      mockTripRepository.save.mockImplementationOnce(async (trip) => cloneTrip(trip));

      await act(async () => {
        await tripsContext!.removeTravellerFromTrip(TRIP_ID, { packingProfileId: 'profile-emilie' });
      });

      const snapshot = tripListsSnapshot(getTrip());
      expect(snapshot.map((list) => list.id)).toEqual([ME_LIST_ID, JONAS_LIST_ID]);
      expect(snapshot.find((list) => list.id === EMILIE_LIST_ID)).toBeUndefined();
      expect(tripsContext!.activePackingListId).not.toBe(EMILIE_LIST_ID);
      expect(getTrip().packingLists.find((list) => list.id === ME_LIST_ID)!.items[0]?.id).toBe(
        'item-me',
      );
    });

    it('restores Emilie list and active ids when repository save fails', async () => {
      await mountTripsProvider([createThreeListFixture()]);
      await runProviderMutation(() => {
        tripsContext!.beginTripPackEntry(TRIP_ID, EMILIE_LIST_ID);
      });

      const before = tripListsSnapshot(getTrip());
      const beforeActiveTripId = tripsContext!.activeTripId;
      const beforeActiveListId = tripsContext!.activePackingListId;

      mockTripRepository.save.mockRejectedValueOnce(new Error('remove save failed'));

      await act(async () => {
        await expect(
          tripsContext!.removeTravellerFromTrip(TRIP_ID, { packingProfileId: 'profile-emilie' }),
        ).rejects.toThrow('remove save failed');
      });

      expect(tripListsSnapshot(getTrip())).toEqual(before);
      expect(tripsContext!.activeTripId).toBe(beforeActiveTripId);
      expect(tripsContext!.activePackingListId).toBe(beforeActiveListId);
    });
  });

  describe('deleteTripPermanently', () => {
    it('clears active state when deleting the active trip', async () => {
      await mountTripsProvider([createMultiListFixture(), createOtherTrip()]);
      await runProviderMutation(() => {
        tripsContext!.beginTripPackEntry(TRIP_ID, EMILIE_LIST_ID);
      });

      mockTripRepository.delete.mockResolvedValueOnce(undefined);

      await act(async () => {
        await tripsContext!.deleteTripPermanently(TRIP_ID);
      });

      expect(tripsContext!.trips.some((trip) => trip.id === TRIP_ID)).toBe(false);
      expect(tripsContext!.trips.some((trip) => trip.id === OTHER_TRIP_ID)).toBe(true);
      expect(tripsContext!.activeTripId).toBeNull();
      expect(tripsContext!.activePackingListId).toBeNull();
      expect(mockTripRepository.delete).toHaveBeenCalledWith(TRIP_ID);
    });

    it('restores trip and active ids when repository delete fails', async () => {
      await mountTripsProvider([createMultiListFixture(), createOtherTrip()]);
      await runProviderMutation(() => {
        tripsContext!.beginTripPackEntry(TRIP_ID, EMILIE_LIST_ID);
      });

      const beforeTrips = tripsContext!.trips.map((trip) => trip.id);
      mockTripRepository.delete.mockRejectedValueOnce(new Error('delete failed'));

      await act(async () => {
        await expect(tripsContext!.deleteTripPermanently(TRIP_ID)).rejects.toThrow('delete failed');
      });

      expect(tripsContext!.trips.map((trip) => trip.id)).toEqual(beforeTrips);
      expect(tripsContext!.activeTripId).toBe(TRIP_ID);
      expect(tripsContext!.activePackingListId).toBe(EMILIE_LIST_ID);
    });
  });

  describe('updateTripSharedDetails', () => {
    it('rolls back shared details and preserves packing lists when save fails', async () => {
      const fixture = createMultiListFixture();
      await mountTripsProvider([fixture]);
      const beforeLists = tripListsSnapshot(getTrip());
      const beforeNote = getTrip().note;
      const beforeInsights = [...getTrip().insights];

      mockTripRepository.save.mockRejectedValueOnce(new Error('shared save failed'));

      await act(async () => {
        await expect(
          tripsContext!.updateTripSharedDetails(TRIP_ID, {
            note: 'Changed note',
            tripContext: ['Marathon'],
          }),
        ).rejects.toThrow('shared save failed');
      });

      expect(getTrip().note).toBe(beforeNote);
      expect(getTrip().insights).toEqual(beforeInsights);
      expect(tripListsSnapshot(getTrip())).toEqual(beforeLists);
    });
  });

  describe('stale active list safety', () => {
    it('no-ops item mutation when activePackingListId is missing from the trip', async () => {
      await mountTripsProvider([createMultiListFixture()]);
      const before = tripListsSnapshot(getTrip());

      await runProviderMutation(() => {
        tripsContext!.setActiveTripId(TRIP_ID);
        tripsContext!.setActivePackingListId('stale-list-id');
        tripsContext!.togglePacked('item-emilie');
        tripsContext!.addPackingItem({ name: 'Should not appear', category: 'Clothing' });
      });

      expect(tripListsSnapshot(getTrip())).toEqual(before);
      expect(mockTripRepository.updatePackingItem).not.toHaveBeenCalled();
      expect(mockTripRepository.addPackingItem).not.toHaveBeenCalled();
    });

    it('does not fall back to first list when active list is stale', async () => {
      await mountTripsProvider([createMultiListFixture()]);
      const mePackedBefore = getTrip().packingLists[0]!.items[0]?.packed;

      await runProviderMutation(() => {
        tripsContext!.setActiveTripId(TRIP_ID);
        tripsContext!.setActivePackingListId('stale-list-id');
        tripsContext!.togglePacked('item-me');
      });

      expect(getTrip().packingLists[0]!.items[0]?.packed).toBe(mePackedBefore);
      expect(mockTripRepository.updatePackingItem).not.toHaveBeenCalled();
    });

    it('no-ops item mutations after refresh drops the previously active list', async () => {
      await mountTripsProvider([createThreeListFixture()]);
      await activateEmilieList();

      const fixtureWithoutEmilie = createThreeListFixture();
      fixtureWithoutEmilie.packingLists = fixtureWithoutEmilie.packingLists.filter(
        (list) => list.id !== EMILIE_LIST_ID,
      );
      mockTripRepository.getAll.mockResolvedValueOnce([cloneTrip(fixtureWithoutEmilie)]);

      await act(async () => {
        await tripsContext!.refreshTrips();
      });

      expect(tripsContext!.activePackingListId).toBeNull();

      const afterRefresh = tripListsSnapshot(getTrip());
      await runProviderMutation(() => {
        tripsContext!.togglePacked('item-me');
        tripsContext!.addPackingItem({ name: 'Should not appear', category: 'Clothing' });
      });

      expect(tripListsSnapshot(getTrip())).toEqual(afterRefresh);
      expect(mockTripRepository.updatePackingItem).not.toHaveBeenCalled();
      expect(mockTripRepository.addPackingItem).not.toHaveBeenCalled();
    });
  });
});
