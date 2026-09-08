import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { resolveActiveDraftIdForMutation } from '@/domain/trip-drafts-state';
import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';
import type { Trip } from '@/domain/trip';
import { normalizeTrip, type TripLike } from '@/domain/trip-compatibility';
import { cloneTrip } from '@/lib/clone-trip';
import { mockLisbonTrip } from '@/mocks/seed-trips';
import { TripsProvider, useTrips, type TripsContextValue } from '@/providers/trips-provider';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';

const TRIP_A_ID = 'trip-runtime-a';
const TRIP_B_ID = 'trip-runtime-b';
const ME_LIST_ID = `${TRIP_A_ID}-list-me`;
const EMILIE_LIST_ID = `${TRIP_A_ID}-list-emilie`;
const JONAS_LIST_ID = `${TRIP_A_ID}-list-jonas`;

let tripsContext: TripsContextValue | null = null;
let mockIsAuthReady = true;
let mockUserId: string | null = 'user-test';
let renderer: TestRenderer.ReactTestRenderer | null = null;

function currentTripsContext(): TripsContextValue | null {
  return tripsContext;
}

function tripListsSnapshot(trip: Trip | null | undefined) {
  return (trip?.packingLists ?? []).map((list) => ({
    id: list.id,
    profileName: list.profileSnapshot.name,
    items: list.items.map((item) => ({
      id: item.id,
      name: item.name,
      packed: item.packed,
      quantity: item.quantity,
    })),
  }));
}

function createMultiListFixture(): Trip {
  const lisbon = cloneTrip(mockLisbonTrip);
  return normalizeTrip({
    ...lisbon,
    id: TRIP_A_ID,
    name: 'Runtime test trip',
    title: 'Runtime test trip',
    packingLists: [
      {
        id: ME_LIST_ID,
        packingProfileId: `${TRIP_A_ID}-profile-self`,
        profileSnapshot: { id: `${TRIP_A_ID}-profile-self`, name: 'Me', isSelf: true },
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
            needToBuy: false,
            assignedTo: null,
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
            packed: false,
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
    id: TRIP_B_ID,
    name: 'Other trip',
    title: 'Other trip',
    packingLists: [
      {
        id: `${TRIP_B_ID}-list-other`,
        packingProfileId: `${TRIP_B_ID}-profile-self`,
        profileSnapshot: { id: `${TRIP_B_ID}-profile-self`, name: 'Me', isSelf: true },
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
      trips = trips.map((entry) => (entry.id === trip.id ? cloneTrip(trip) : entry));
      return cloneTrip(trip);
    }),
    createTrip: jest.fn(async (trip: Trip) => {
      trips = [cloneTrip(trip), ...trips.filter((entry) => entry.id !== trip.id)];
      return cloneTrip(trip);
    }),
    delete: jest.fn(async (id: string) => {
      trips = trips.filter((entry) => entry.id !== id);
    }),
    updateTripPackingItems: jest.fn(),
    updatePackingItem: jest.fn(async () => ({
      id: 'item-stub',
      name: 'Stub',
      quantity: 1,
      category: 'Clothing' as const,
      packed: false,
      needToBuy: false,
      assignedTo: null,
    })),
    addPackingItem: jest.fn(async (_tripId, input) => ({
      id: input.id ?? 'item-stub',
      name: input.name,
      quantity: input.quantity ?? 1,
      category: input.category,
      packed: input.packed ?? false,
      needToBuy: input.needToBuy ?? false,
      assignedTo: input.assignedTo ?? null,
    })),
    deletePackingItem: jest.fn(async () => undefined),
  };
}

const mockTripRepository = createTripRepositoryMock([]);

jest.mock('@/config/persistence', () => ({
  getPersistenceMode: jest.fn(() => 'mock' as const),
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthReady: mockIsAuthReady,
    authError: null,
    userId: mockUserId,
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

async function mountTripsProvider(
  initialTrips: Trip[] = [],
  options?: { requireLoaded?: boolean },
): Promise<void> {
  const requireLoaded = options?.requireLoaded ?? true;
  Object.assign(mockTripRepository, createTripRepositoryMock(initialTrips));
  tripsContext = null;
  renderer = null;

  await act(async () => {
    renderer = TestRenderer.create(
      <TripsProvider>
        <TripsProbe />
      </TripsProvider>,
    );

    if (requireLoaded) {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await Promise.resolve();
        const context = currentTripsContext();
        if (context && !context.isLoading) {
          break;
        }
      }
    } else {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await Promise.resolve();
        if (currentTripsContext()) {
          break;
        }
      }
    }
  });

  const loadedContext = currentTripsContext();
  if (!loadedContext) {
    throw new Error('TripsProvider failed to expose context in test harness');
  }

  if (requireLoaded && loadedContext.isLoading) {
    throw new Error('TripsProvider failed to finish loading in test harness');
  }
}

async function rerenderTripsProvider(): Promise<void> {
  if (!renderer) {
    throw new Error('TripsProvider renderer is not mounted');
  }

  await act(async () => {
    renderer!.update(
      <TripsProvider>
        <TripsProbe />
      </TripsProvider>,
    );

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await Promise.resolve();
      const context = currentTripsContext();
      if (context && !context.isLoading) {
        break;
      }
    }
  });
}

function seedCommitReadyDraft(): void {
  act(() => {
    tripsContext!.createNewDraft();
    tripsContext!.setDraft({
      destination: createDestinationFromText('Oslo', 'Norway'),
      startDate: '2026-10-01',
      endDate: '2026-10-10',
      tripContext: ['City'],
      accommodation: 'hotel',
      laundry: 'no',
      packingProfiles: [{ id: DRAFT_SELF_PROFILE_ID, name: 'Me', isSelf: true }],
    });
    tripsContext!.markDraftReachedSummary();
  });
}

function hasValidActiveDraft(): boolean {
  return (
    resolveActiveDraftIdForMutation({
      drafts: tripsContext!.drafts,
      activeDraftId: tripsContext!.activeDraftId,
    }) !== null
  );
}

describe('TripsProvider runtime state (VH3-B)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthReady = true;
    mockUserId = 'user-test';
  });

  describe('bootstrap and refresh', () => {
    it('does not auto-select the first trip after initial load', async () => {
      await mountTripsProvider([createMultiListFixture(), createOtherTrip()]);

      expect(tripsContext!.trips).toHaveLength(2);
      expect(tripsContext!.activeTripId).toBeNull();
      expect(tripsContext!.activePackingListId).toBeNull();
      expect(tripsContext!.activeTrip).toBeNull();
    });

    it('does not auto-select the first packing list on a multi-list trip', async () => {
      await mountTripsProvider([createMultiListFixture()]);

      await runProviderMutation(() => {
        tripsContext!.setActiveTripId(TRIP_A_ID);
      });

      expect(tripsContext!.activeTripId).toBe(TRIP_A_ID);
      expect(tripsContext!.activePackingListId).toBeNull();
    });

    it('beginTripPackEntry on multi-list trip without explicit list requires picker', async () => {
      await mountTripsProvider([createMultiListFixture()]);

      let destination: 'pack' | 'select-list' = 'pack';
      await runProviderMutation(() => {
        destination = tripsContext!.beginTripPackEntry(TRIP_A_ID);
      });

      expect(destination).toBe('select-list');
      expect(tripsContext!.activeTripId).toBe(TRIP_A_ID);
      expect(tripsContext!.activePackingListId).toBeNull();
      expect(tripsContext!.activePackingListId).not.toBe(ME_LIST_ID);
    });

    it('refresh clears stale activeTripId when the trip no longer exists', async () => {
      await mountTripsProvider([createMultiListFixture()]);
      const beforeLists = tripListsSnapshot(tripsContext!.trips[0]);

      await runProviderMutation(() => {
        tripsContext!.setActiveTripId('missing-trip-id');
        tripsContext!.setActivePackingListId('missing-list-id');
      });

      mockTripRepository.getAll.mockResolvedValueOnce([cloneTrip(createMultiListFixture())]);

      await act(async () => {
        await tripsContext!.refreshTrips();
      });

      expect(tripsContext!.activeTripId).toBeNull();
      expect(tripsContext!.activePackingListId).toBeNull();
      expect(tripListsSnapshot(tripsContext!.trips[0])).toEqual(beforeLists);
    });

    it('refresh clears stale activePackingListId when the list was removed', async () => {
      await mountTripsProvider([createThreeListFixture()]);

      await runProviderMutation(() => {
        tripsContext!.beginTripPackEntry(TRIP_A_ID, EMILIE_LIST_ID);
      });

      const withoutEmilie = createThreeListFixture();
      withoutEmilie.packingLists = withoutEmilie.packingLists.filter(
        (list) => list.id !== EMILIE_LIST_ID,
      );
      mockTripRepository.getAll.mockResolvedValueOnce([cloneTrip(withoutEmilie)]);

      const beforeLists = tripListsSnapshot(tripsContext!.trips[0]);

      await act(async () => {
        await tripsContext!.refreshTrips();
      });

      expect(tripsContext!.activeTripId).toBe(TRIP_A_ID);
      expect(tripsContext!.activePackingListId).toBeNull();
      expect(tripListsSnapshot(tripsContext!.trips[0])).toEqual(
        tripListsSnapshot(withoutEmilie),
      );
      expect(tripListsSnapshot(tripsContext!.trips[0])).not.toEqual(beforeLists);
    });
  });

  describe('structural mutation reconciliation', () => {
    it('removing the non-active list preserves activePackingListId', async () => {
      await mountTripsProvider([createThreeListFixture()]);

      await runProviderMutation(() => {
        tripsContext!.beginTripPackEntry(TRIP_A_ID, ME_LIST_ID);
      });

      mockTripRepository.save.mockImplementationOnce(async (trip) => cloneTrip(trip));

      await act(async () => {
        await tripsContext!.removeTravellerFromTrip(TRIP_A_ID, { packingProfileId: 'profile-emilie' });
      });

      expect(tripsContext!.activePackingListId).toBe(ME_LIST_ID);
      expect(
        tripsContext!.trips[0]!.packingLists.some((list) => list.id === EMILIE_LIST_ID),
      ).toBe(false);
    });

    it('deleting a non-active trip preserves active trip and list', async () => {
      await mountTripsProvider([createMultiListFixture(), createOtherTrip()]);

      await runProviderMutation(() => {
        tripsContext!.beginTripPackEntry(TRIP_A_ID, EMILIE_LIST_ID);
      });

      mockTripRepository.delete.mockResolvedValueOnce(undefined);

      await act(async () => {
        await tripsContext!.deleteTripPermanently(TRIP_B_ID);
      });

      expect(tripsContext!.activeTripId).toBe(TRIP_A_ID);
      expect(tripsContext!.activePackingListId).toBe(EMILIE_LIST_ID);
      expect(tripsContext!.trips.some((trip) => trip.id === TRIP_B_ID)).toBe(false);
    });
  });

  describe('auth readiness', () => {
    beforeEach(() => {
      mockIsAuthReady = false;
    });

    it('does not load trips before auth is ready', async () => {
      await mountTripsProvider([createMultiListFixture()], { requireLoaded: false });

      expect(mockTripRepository.getAll).not.toHaveBeenCalled();
      expect(tripsContext!.isLoading).toBe(true);
      expect(tripsContext!.trips).toEqual([]);
    });

    it('loads trips once after auth becomes ready', async () => {
      await mountTripsProvider([createMultiListFixture()], { requireLoaded: false });
      expect(mockTripRepository.getAll).not.toHaveBeenCalled();

      mockTripRepository.getAll.mockResolvedValueOnce([cloneTrip(createMultiListFixture())]);
      mockIsAuthReady = true;

      await rerenderTripsProvider();

      expect(mockTripRepository.getAll).toHaveBeenCalledTimes(1);
      expect(tripsContext!.trips).toHaveLength(1);
      expect(tripsContext!.activeTripId).toBeNull();
    });
  });

  describe('commit draft double submit', () => {
    beforeEach(async () => {
      await mountTripsProvider([]);
      seedCommitReadyDraft();
    });

    it('shares one in-flight commit and one createTrip call for concurrent submits', async () => {
      mockTripRepository.createTrip.mockImplementation(async (trip) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return cloneTrip(trip);
      });

      let first!: Trip;
      let second!: Trip;

      await act(async () => {
        const pendingFirst = tripsContext!.commitDraftTrip('manual');
        const pendingSecond = tripsContext!.commitDraftTrip('manual');
        first = await pendingFirst;
        second = await pendingSecond;
      });

      expect(mockTripRepository.createTrip).toHaveBeenCalledTimes(1);
      expect(first.id).toBe(second.id);
      expect(hasValidActiveDraft()).toBe(false);
    });

    it('releases commit guard after failure so retry can succeed', async () => {
      mockTripRepository.createTrip.mockRejectedValueOnce(new Error('create failed'));

      await act(async () => {
        await expect(tripsContext!.commitDraftTrip('manual')).rejects.toThrow('create failed');
      });

      expect(tripsContext!.isCommitDraftInFlight).toBe(false);
      expect(hasValidActiveDraft()).toBe(true);

      mockTripRepository.createTrip.mockImplementation(async (trip) => cloneTrip(trip));

      await act(async () => {
        await tripsContext!.commitDraftTrip('manual');
      });

      expect(mockTripRepository.createTrip).toHaveBeenCalledTimes(2);
      expect(hasValidActiveDraft()).toBe(false);
    });
  });

  describe('reuse submit behavior', () => {
    it('creates one trip per reuseTrip call — UI submitGuardRef prevents double submit', async () => {
      const source = createMultiListFixture();
      await mountTripsProvider([source]);

      mockTripRepository.createTrip.mockImplementation(async (trip) => cloneTrip(trip));

      const input = {
        packingListIds: [EMILIE_LIST_ID],
        sharedDetails: {
          destination: source.destination,
          startDate: '2026-11-01',
          endDate: '2026-11-10',
          tripContext: [...source.tripContext],
          accommodation: source.accommodation,
          laundry: source.laundry,
          bags: source.bags.map((bag) => ({ ...bag })),
          note: source.note,
        },
        newTravellers: [],
      };

      await act(async () => {
        await tripsContext!.reuseTrip(source.id, input);
        await tripsContext!.reuseTrip(source.id, input);
      });

      expect(mockTripRepository.createTrip).toHaveBeenCalledTimes(2);
    });
  });

  describe('concurrent item mutations', () => {
    beforeEach(async () => {
      await mountTripsProvider([createMultiListFixture()]);
      await runProviderMutation(() => {
        tripsContext!.beginTripPackEntry(TRIP_A_ID, EMILIE_LIST_ID);
      });
    });

    it('applies last optimistic toggle state across successive packed toggles', async () => {
      mockTripRepository.updatePackingItem.mockResolvedValue({ packed: true });

      await runProviderMutation(() => {
        tripsContext!.togglePacked('item-emilie');
      });
      await runProviderMutation(() => {
        tripsContext!.togglePacked('item-emilie');
      });

      const item = tripsContext!.trips[0]!.packingLists.find((list) => list.id === EMILIE_LIST_ID)!
        .items[0]!;
      expect(item.packed).toBe(false);
      expect(mockTripRepository.updatePackingItem).toHaveBeenCalledTimes(2);
      expect(
        tripsContext!.trips[0]!.packingLists.find((list) => list.id === ME_LIST_ID)!.items[0]?.packed,
      ).toBe(false);
    });

    it('does not double-apply toggles fired in the same synchronous turn (tripsRef lag)', async () => {
      mockTripRepository.updatePackingItem.mockResolvedValue({ packed: true });

      await runProviderMutation(() => {
        tripsContext!.togglePacked('item-emilie');
        tripsContext!.togglePacked('item-emilie');
      });

      const item = tripsContext!.trips[0]!.packingLists.find((list) => list.id === EMILIE_LIST_ID)!
        .items[0]!;
      expect(item.packed).toBe(true);
      expect(mockTripRepository.updatePackingItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('bootstrap load failure', () => {
    it('surfaces repository error without crashing and allows refresh retry', async () => {
      Object.assign(mockTripRepository, createTripRepositoryMock([]));
      mockTripRepository.getAll.mockRejectedValueOnce(new Error('load failed'));
      tripsContext = null;
      renderer = null;

      await act(async () => {
        renderer = TestRenderer.create(
          <TripsProvider>
            <TripsProbe />
          </TripsProvider>,
        );

        for (let attempt = 0; attempt < 30; attempt += 1) {
          await Promise.resolve();
          const context = currentTripsContext();
          if (context && !context.isLoading) {
            break;
          }
        }
      });

      expect(tripsContext!.trips).toEqual([]);
      expect(tripsContext!.repositoryError).toBe('load failed');
      expect(tripsContext!.activeTripId).toBeNull();

      mockTripRepository.getAll.mockResolvedValueOnce([cloneTrip(createMultiListFixture())]);

      await act(async () => {
        await tripsContext!.refreshTrips();
      });

      expect(tripsContext!.trips).toHaveLength(1);
      expect(tripsContext!.activeTripId).toBeNull();
    });
  });
});
