import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createDestinationFromText } from '@/domain/destination';
import { resolveActiveDraftIdForMutation } from '@/domain/trip-drafts-state';
import { DRAFT_SELF_PROFILE_ID } from '@/domain/trip-draft-profiles';
import type { Trip } from '@/domain/trip';
import {
  resolvePostCreateNavigationAfterCommit,
  resolvePostCreatePackHref,
} from '@/domain/post-create-pack-navigation';
import { cloneTrip } from '@/lib/clone-trip';
import { TripsProvider, useTrips, type TripsContextValue } from '@/providers/trips-provider';
import type { TripRepository } from '@/repositories/trips/trip-repository';
import { mockPackingGenerator } from '@/services/packing/mock-packing-generator';
import { mockWeatherService } from '@/services/weather/mock-weather-service';

let tripsContext: TripsContextValue | null = null;

function currentTripsContext(): TripsContextValue | null {
  return tripsContext;
}

function createTripRepositoryMock(initialTrips: Trip[]): TripRepository & {
  getAll: jest.Mock;
  createTrip: jest.Mock;
} {
  let trips = initialTrips.map((trip) => cloneTrip(trip));

  return {
    getAll: jest.fn(async () => trips.map((trip) => cloneTrip(trip))),
    getById: jest.fn(async (id: string) => trips.find((entry) => entry.id === id) ?? null),
    save: jest.fn(async (trip: Trip) => trip),
    createTrip: jest.fn(async (trip: Trip) => {
      trips = [cloneTrip(trip), ...trips.filter((entry) => entry.id !== trip.id)];
      return cloneTrip(trip);
    }),
    delete: jest.fn(async (id: string) => {
      trips = trips.filter((entry) => entry.id !== id);
    }),
    updatePackingItem: jest.fn(),
    addPackingItem: jest.fn(),
    deletePackingItem: jest.fn(),
    updateTripPackingItems: jest.fn(),
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

async function flushAsync(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function mountTripsProvider(): Promise<void> {
  Object.assign(mockTripRepository, createTripRepositoryMock([]));
  tripsContext = null;

  await act(async () => {
    TestRenderer.create(
      <TripsProvider>
        <TripsProbe />
      </TripsProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (currentTripsContext()) {
      break;
    }
    await flushAsync();
  }
}

function seedCommitReadyDraft(options?: { multiProfile?: boolean }): void {
  act(() => {
    tripsContext!.createNewDraft();
    tripsContext!.setDraft({
      destination: createDestinationFromText('Oslo', 'Norway'),
      startDate: '2026-10-01',
      endDate: '2026-10-10',
      tripContext: ['City'],
      accommodation: 'hotel',
      laundry: 'no',
      packingProfiles: options?.multiProfile
        ? [
            { id: DRAFT_SELF_PROFILE_ID, name: 'Me', isSelf: true },
            { id: 'profile-emilie', name: 'Emilie', age: 8, isSelf: false },
          ]
        : [{ id: DRAFT_SELF_PROFILE_ID, name: 'Me', isSelf: true }],
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

describe('TripsProvider post-create navigation (VH2-E)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await mountTripsProvider();
  });

  it('keeps commit in flight after one-list success until acknowledge', async () => {
    seedCommitReadyDraft();
    expect(hasValidActiveDraft()).toBe(true);

    let saved!: Trip;
    await act(async () => {
      saved = await tripsContext!.commitDraftTrip('manual');
    });
    await flushAsync();

    expect(hasValidActiveDraft()).toBe(false);
    expect(tripsContext!.isCommitDraftInFlight).toBe(true);
    expect(tripsContext!.activeTripId).toBe(saved.id);
    expect(tripsContext!.activePackingListId).toBe(saved.packingLists[0]?.id ?? null);
    expect(resolvePostCreatePackHref(saved)).toBe('/(tabs)/pack');
    expect(resolvePostCreateNavigationAfterCommit({ ok: true, trip: saved })).toBe('/(tabs)/pack');

    act(() => {
      tripsContext!.acknowledgeCommitDraftNavigation();
    });

    expect(tripsContext!.isCommitDraftInFlight).toBe(false);
  });

  it('keeps commit in flight for multi-list success with null active list until acknowledge', async () => {
    seedCommitReadyDraft({ multiProfile: true });
    expect(hasValidActiveDraft()).toBe(true);

    let saved!: Trip;
    await act(async () => {
      saved = await tripsContext!.commitDraftTrip('manual');
    });
    await flushAsync();

    expect(saved.packingLists.length).toBeGreaterThan(1);
    expect(hasValidActiveDraft()).toBe(false);
    expect(tripsContext!.isCommitDraftInFlight).toBe(true);
    expect(tripsContext!.activeTripId).toBe(saved.id);
    expect(tripsContext!.activePackingListId).toBeNull();
    expect(tripsContext!.activePackingListId).not.toBe(saved.packingLists[0]?.id);
    expect(resolvePostCreatePackHref(saved)).toBe('/(tabs)/pack/select-list');

    act(() => {
      tripsContext!.acknowledgeCommitDraftNavigation();
    });

    expect(tripsContext!.isCommitDraftInFlight).toBe(false);
  });

  it('does not navigate or acknowledge on commit failure and preserves the draft', async () => {
    seedCommitReadyDraft();
    const draftIdBefore = tripsContext!.activeDraftId;
    mockTripRepository.createTrip.mockRejectedValueOnce(new Error('create failed'));

    let commitError: unknown;
    await act(async () => {
      try {
        await tripsContext!.commitDraftTrip('manual');
      } catch (error) {
        commitError = error;
      }
    });
    expect(commitError).toEqual(expect.objectContaining({ message: 'create failed' }));
    await flushAsync();

    expect(resolvePostCreateNavigationAfterCommit({ ok: false })).toBeNull();
    expect(tripsContext!.isCommitDraftInFlight).toBe(false);
    expect(hasValidActiveDraft()).toBe(true);
    expect(tripsContext!.activeDraftId).toBe(draftIdBefore);
    expect(tripsContext!.activeTripId).toBeNull();
  });
});
